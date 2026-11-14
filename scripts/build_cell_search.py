r"""Mission-aware search across all screened NASA POWER cells (terrainx-cell-search-v1).

A separate, versioned experiment: the released discovery (aridity-ranked shortlist,
dataset.json and its scores) is NOT modified. Every one of the 130 screened cells is
characterized with the pipeline's own functions — SRTM 7x7 grid via OpenTopoData
(`sample_grid`), `terrain_metrics`, Macrostrat (`fetch_geology` / `classify_geology`),
`mission_utility`, `physical_fidelity` and `combined_priority` — read from the
content-addressed cache (`--offline` by default), so results reproduce without network.

Differences from the released candidate characterization, stated in the output:
- cells have regional POWER precipitation only; point T2M climatology was not acquired,
  so the temperature criterion is missing (coverage < 1, never treated as zero);
- the search ranks cells by combined priority P per mission and then applies the same
  per-region count (4) and 65 km separation as the released shortlist.

Run: .venv\Scripts\python.exe scripts\build_cell_search.py [--online]
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from science.ingestion.cache import CACHE, CachedHTTP, atomic_json
from science.ingestion.srtm import sample_grid
from science.ingestion.macrostrat import fetch_geology, classify_geology
from science.analysis.terrain import terrain_metrics
from science.analysis.discovery import distance_km
from science.analysis.similarity import physical_fidelity
from science.analysis.utility import mission_utility, combined_priority

CONTRACT = "terrainx-cell-search-v1"
ALPHA = {"jezero": .30, "mare-crisium": .55}
PER_REGION, SEPARATION_KM = 4, 65


def criteria(cell: dict, terrain: dict, geology: dict, mission: str) -> dict:
    geo = classify_geology(geology, mission)
    metrics = terrain.get("metrics") or {}
    ideal = 3 if mission == "jezero" else 5
    terrain_value = math.exp(-.5 * ((metrics["p90_slope_deg"] - ideal) / 5) ** 2) if metrics else None
    annual = cell.get("annual_precip_mm")
    return {
        "geology": geo,
        "terrain": {"value": terrain_value, "rationale": "Same bell-shaped p90-slope preference as the released model.", "source_refs": [s["source_url"] for s in terrain.get("provenance", [])], "classification": "ASSUMED"},
        "aridity": {"value": None if annual is None else max(0, min(1, 1 - annual / 400)), "rationale": "clamp(1 - annual_mm/400) from the cell's NASA POWER regional climatology.", "source_refs": [cell["provenance"]["source_url"]], "classification": "ASSUMED"},
        "temperature": {"value": None, "rationale": "Point T2M climatology was not acquired for screened cells; left missing, never zero.", "source_refs": [], "classification": "UNAVAILABLE"},
    }


def shortlist(rows: list[dict], key: str) -> list[str]:
    chosen = []
    for region in sorted({r["region_id"] for r in rows}):
        ranked = sorted((r for r in rows if r["region_id"] == region and r[key] is not None), key=lambda r: (-r[key], r["latitude"], r["longitude"]))
        regional = []
        for row in ranked:
            if all(distance_km(row, other) >= SEPARATION_KM for other in regional):
                regional.append(row)
            if len(regional) == PER_REGION:
                break
        chosen += [r["id"] for r in regional]
    return chosen


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--online", action="store_true", help="allow network fetches for missing cache entries")
    args = parser.parse_args()
    client = CachedHTTP(offline=not args.online)
    derived = ROOT / "data" / "derived"
    cells = [f["properties"] for f in json.loads((derived / "screened_cells.geojson").read_text(encoding="utf-8"))["features"]]
    dataset = json.loads((derived / "dataset.json").read_text(encoding="utf-8"))
    targets = dataset["targets"]  # released targets carry derived metrics and provenance
    released = [c["id"] for c in dataset["candidates"] if not c.get("benchmark")]

    rows, errors = [], []
    for cell in cells:
        lat, lon = cell["latitude"], cell["longitude"]
        row = {k: cell[k] for k in ("id", "region_id", "latitude", "longitude", "annual_precip_mm", "aridity")}
        row["released_candidate"] = cell["id"] in released
        try:
            terrain = sample_grid(client, lat, lon)
            terrain["metrics"] = terrain_metrics(terrain["elevations_m"], 4000)
        except Exception as exc:  # recorded, never filled in
            terrain = {"status": "unavailable", "reason": str(exc), "provenance": []}
            errors.append({"cell": cell["id"], "stage": "srtm", "reason": str(exc)})
        try:
            geology = fetch_geology(client, lat, lon)
        except Exception as exc:
            geology = {"status": "unavailable", "units": [], "source_refs": [], "reason": str(exc)}
            errors.append({"cell": cell["id"], "stage": "geology", "reason": str(exc)})
        unit = (geology.get("units") or [{}])[0]
        row["terrain"] = {k: terrain.get(k) for k in ("status", "reason", "elevations_m", "sample_spacing_m", "footprint_m", "native_resolution_m", "metrics")}
        row["terrain"]["source_urls"] = [s["source_url"] for s in terrain.get("provenance", [])]
        row["geology"] = {"status": geology.get("status"), "unit_name": unit.get("name") or unit.get("strat_name") or None, "lith": unit.get("lith") or None, "description": (unit.get("descrip") or "")[:400] or None, "map_id": unit.get("map_id"), "source_id": unit.get("source_id"), "age": unit.get("best_int_name"), "units_count": len(geology.get("units") or []), "source_refs": geology.get("source_refs", [])}
        row["missions"] = {}
        for target in targets:
            mission = target["id"]
            crit = criteria(cell, terrain, geology, mission)
            utility = mission_utility(crit, mission)
            fidelity = physical_fidelity(terrain, target.get("terrain"))
            priority = combined_priority(fidelity["value"], utility, ALPHA[mission])
            reason = None
            if fidelity["value"] is None:
                reason = fidelity["reason"]
            elif crit["geology"]["value"] is None:
                reason = "Geology not matched to this mission — not rankable as a geological analog"
            elif utility["coverage"] < .70:
                reason = "Coverage below 70%"
            row["missions"][mission] = {"F": fidelity["value"], "U": utility["value"], "C": utility["coverage"], "P": priority, "reason": reason if priority is None else None, "criteria": {k: v["value"] for k, v in crit.items()}, "geology_rationale": crit["geology"]["rationale"]}
        rows.append(row)

    out = {"contract": CONTRACT, "generated_at": datetime.now(timezone.utc).isoformat(), "cells": len(rows), "terrain_available": sum(r["terrain"]["status"] == "available" for r in rows), "geology_mapped": sum(r["geology"]["status"] == "mapped" for r in rows), "rules": {"alpha": ALPHA, "per_region": PER_REGION, "separation_km": SEPARATION_KM, "temperature": "missing for all cells (not acquired)", "ranking": "combined priority P per mission; P requires F, assessed geology and C >= 0.70"}, "released_shortlist": released, "missions": {}, "rows": [], "errors": errors}
    for target in targets:
        mission = target["id"]
        flat = [{**r, "P": r["missions"][mission]["P"], "F": r["missions"][mission]["F"]} for r in rows]
        ranked = sorted((r for r in flat if r["P"] is not None), key=lambda r: (-r["P"], r["id"]))
        for i, r in enumerate(ranked):
            next(x for x in rows if x["id"] == r["id"])["missions"][mission]["rank"] = i + 1
        mission_short = shortlist(flat, "P")
        terrain_short = shortlist(flat, "F")
        out["missions"][mission] = {"eligible": len(ranked), "shortlist": mission_short, "terrain_shortlist": terrain_short, "overlap_with_release": sorted(set(mission_short) & set(released)), "new_vs_release": [i for i in mission_short if i not in released]}
    for r in rows:
        for m in r["missions"].values():
            m.setdefault("rank", None)
    out["rows"] = rows
    cached = []
    for r in rows:
        for url in r["terrain"]["source_urls"] + r["geology"]["source_refs"]:
            import hashlib
            path = CACHE / (hashlib.sha256(url.encode()).hexdigest() + ".json")
            if path.exists():
                rec = json.loads(path.read_text(encoding="utf-8"))
                cached.append({"url": url, "sha256": rec["sha256"], "retrieved_at": rec["retrieved_at"], "file": f"data/cached/{path.name}"})
    out["provenance"] = sorted({c["url"]: c for c in cached}.values(), key=lambda c: c["url"])
    atomic_json(derived / "cell_search.json", out)
    # Public copy: SRTM request URLs (~1.6 kB each) are replaced by their cache file + SHA-256;
    # the full URLs stay in data/derived/cell_search.json and in data/cached/.
    public = json.loads(json.dumps(out))
    for r in public["rows"]:
        r["terrain"].pop("source_urls", None)
        if r["terrain"].get("elevations_m"):
            r["terrain"]["elevations_m"] = [[None if v is None else round(v, 2) for v in row] for row in r["terrain"]["elevations_m"]]
    public["provenance"] = [{**{k: v for k, v in c.items() if k != "url"}, "source": "OpenTopoData srtm90m" if "opentopodata" in c["url"] else c["url"]} for c in public["provenance"]]
    target = ROOT / "frontend" / "public" / "data" / "cell_search.json"
    target.write_text(json.dumps(public, separators=(",", ":"), allow_nan=False, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: out[k] for k in ("cells", "terrain_available", "geology_mapped")}, indent=2))
    for mission, m in out["missions"].items():
        print(mission, "eligible", m["eligible"], "shortlist", m["shortlist"], "new", m["new_vs_release"])
    print("errors", len(errors))


if __name__ == "__main__":
    main()
