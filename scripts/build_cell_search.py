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

from science.ingestion.cache import CACHE, CachedHTTP, atomic_json, stable_science_json
from science.ingestion.srtm import sample_grid
from science.ingestion.macrostrat import fetch_geology, classify_geology
from science.analysis.terrain import terrain_metrics
from science.analysis.discovery import distance_km
from science.analysis.similarity import physical_fidelity
from science.analysis.utility import mission_utility, combined_priority
from science.ingestion.power import fetch_point, parse_point, fetch_environment, clean, MONTHS
from science.ingestion.gbif import fetch_occurrence_count
import importlib.util as _ilu
import numpy as np

_spec = _ilu.spec_from_file_location("build_discovery", ROOT / "scripts" / "build_discovery.py")
_bd = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_bd)
released_criteria = _bd.criteria_for  # identical criterion formulas to the released model

KARST = ("limestone", "dolomite", "carbonate", "marble", "gypsum", "evaporite", "anhydrite")
LAVA = ("basalt", "basaltic", "lava", "mafic volcanic", "andesite")


def subsurface_potential(geology: dict) -> dict:
    """Lithology-only proxy: units in which caves commonly form. Never evidence that a cave exists."""
    karst, lava = [], []
    for u in geology.get("units") or []:
        text = " ".join(str(u.get(k, "")) for k in ("name", "strat_name", "lith", "descrip")).lower()
        label = u.get("name") or u.get("strat_name") or u.get("lith") or "unnamed unit"
        if any(w in text for w in KARST):
            karst.append(label)
        if any(w in text for w in LAVA):
            lava.append(label)
    kind = "karst and lava-tube host rocks" if karst and lava else "karst-prone (soluble rock)" if karst else "lava/basalt keywords; tubes unverified" if lava else "no targeted host-rock keyword in mapped units" if geology.get("units") else None
    return {"class": kind, "karst_units": sorted(set(karst))[:4], "lava_units": sorted(set(lava))[:4], "method": "Macrostrat lithology keywords; a host-rock proxy, not a cave inventory."}


def slope_exceedance(elevations, spacing_m=4000.0) -> dict | None:
    z = np.array([[np.nan if v is None else v for v in row] for row in elevations], dtype=float)
    gx = (z[1:-1, 2:] - z[1:-1, :-2]) / (2 * spacing_m)
    gy = (z[2:, 1:-1] - z[:-2, 1:-1]) / (2 * spacing_m)
    s = np.degrees(np.arctan(np.hypot(gx, gy)))
    s = s[np.isfinite(s)]
    if s.size == 0:
        return None
    return {"over_5_deg": float((s > 5).mean()), "over_10_deg": float((s > 10).mean()), "over_15_deg": float((s > 15).mean()), "max_deg": float(s.max()), "baseline_m": 2 * spacing_m}


from science.analysis.environment import environmental_summary as environment

CONTRACT = "terrainx-cell-search-v3"
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
        ranked = sorted((r for r in rows if r["region_id"] == region and r[key] is not None and r.get("land_eligible", True)), key=lambda r: (-r[key], r["latitude"], r["longitude"]))
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

    rows, errors, field_sites = [], [], []
    for cell in cells:
        lat, lon = cell["latitude"], cell["longitude"]
        row = {k: cell[k] for k in ("id", "region_id", "latitude", "longitude", "annual_precip_mm", "aridity")}
        row["released_candidate"] = cell["id"] in released
        row["land_eligible"] = cell.get("land_eligible", True)
        row["land_mask_note"] = cell.get("land_mask_note", "Natural Earth110m broad screen; approximate coastline, not field verification.")
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
        row["geology"]["mapped_units"] = geology.get("units", [])
        row["geology"]["retrieved_at"] = geology.get("retrieved_at")
        try:
            climate = parse_point(fetch_point(client, lat, lon), lat, lon)
        except Exception as exc:
            climate = {}
            errors.append({"cell": cell["id"], "stage": "power-point", "reason": str(exc)})
        try:
            row["environment"] = environment(fetch_environment(client, lat, lon))
        except Exception as exc:
            row["environment"] = None
            errors.append({"cell": cell["id"], "stage": "power-environment", "reason": str(exc)})
        try:
            g = fetch_occurrence_count(client, lat, lon)
            s_, n_, w_, e_ = lat - .25, lat + .25, lon - .3125, lon + .3125
            area = (0.5 * 111.195) * (0.625 * 111.195 * np.cos(np.radians(lat)))
            row["biology"] = {"gbif_occurrences": g["count"], "per_1000_km2": 1000 * g["count"] / area, "cell_area_km2": area, "source_url": g["source_url"], "sha256": g["sha256"], "retrieved_at":g["retrieved_at"], "caveat": "Recorded occurrences reflect sampling effort as much as life; a documented-biology proxy, not habitability."}
        except Exception as exc:
            row["biology"] = None
            errors.append({"cell": cell["id"], "stage": "gbif", "reason": str(exc)})
        row["subsurface"] = subsurface_potential(geology)
        row["mobility"] = slope_exceedance(terrain["elevations_m"]) if terrain.get("status") == "available" else None
        row["climate_observations"] = {k:v for k,v in climate.items() if isinstance(v,dict)}
        row["climate"] = {k: (climate.get(k) or {}).get("value") for k in ("T2M", "WS10M", "ALLSKY_SFC_SW_DWN", "RH2M", "PS")} if climate else None
        if climate:
            row["climate"]["annual_precip_mm"] = climate.get("annual_precip_mm")
            row["climate"]["seasonal_temperature_range_c"] = climate.get("seasonal_temperature_range_c")
        field_site={"id":row['id'],"name":next(r['name'] for r in dataset['regions'] if r['id']==row['region_id'])+f" · cell {lat:.3f}, {lon:.3f}",
          "region_id":row['region_id'],"latitude":lat,"longitude":lon,"benchmark":False,"status":"SCREENED CANDIDATE",
          "terrain":terrain,"climate":climate,"geology":geology,"assessments":{},
          "coordinate_scope":"Algorithmically screened POWER cell anchor; field stations remain proposed and unverified.",
          "source_refs":list(dict.fromkeys([s['source_url'] for s in terrain.get('provenance',[])]+geology.get('source_refs',[])+[o['provenance']['source_url'] for o in climate.values() if isinstance(o,dict)]))}
        row["missions"] = {}
        for target in targets:
            mission = target["id"]
            crit = released_criteria({"climate": climate, "terrain": terrain, "geology": geology}, mission) if climate else criteria(cell, terrain, geology, mission)
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
            row["missions"][mission] = {"F": fidelity["value"], "U": utility["value"], "C": utility["coverage"], "P": priority, "reason": reason if priority is None else None, "criteria_evidence": crit, "criteria": {k: v["value"] for k, v in crit.items()}, "geology_rationale": crit["geology"]["rationale"]}
            assessment={"utility":utility,"fidelity":fidelity,"priority":priority,"alpha":ALPHA[mission],"gamma":1,"minimum_coverage":.7}
            assessment['reality_gap']=_bd.reality_gap(field_site,mission,assessment)
            assessment['experiment']=_bd.experiment(field_site,mission,assessment)
            field_site['assessments'][mission]=assessment
        if row['land_eligible'] and terrain['status']=='available':field_sites.append(field_site)
        if not row["land_eligible"]:
            for result in row["missions"].values():
                result["P"] = None
                result["reason"] = "Center excluded by approximate Natural Earth land screen; terrain shape remains inspectable."
        rows.append(row)

    field_output={'contract':'terrainx-field-sites-v1','source_contract':CONTRACT,'candidates':field_sites,
       'note':'Real cached cell characterizations for proposed field studies; not additions to original discovery counts or field validation.'}
    atomic_json(derived/'field_candidates.json',field_output)
    atomic_json(ROOT/'frontend/public/data/field_candidates.json',field_output)
    out = {"contract": CONTRACT, "generated_at": datetime.now(timezone.utc).isoformat(), "cells": len(rows), "terrain_available": sum(r["terrain"]["status"] == "available" for r in rows), "geology_mapped": sum(r["geology"]["status"] == "mapped" for r in rows), "rules": {"alpha": ALPHA, "per_region": PER_REGION, "separation_km": SEPARATION_KM, "temperature": "NASA POWER point T2M climatology for every cell (same request and formula as released candidates)", "ranking": "combined priority P per mission; P requires F, assessed geology and C >= 0.70"}, "released_shortlist": released, "missions": {}, "rows": [], "errors": errors}
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
    # Relative Earth descriptors only. Percentiles do not establish increasing planetary similarity.
    dims = {
        "soil_dryness": lambda r: None if not r.get("environment") or r["environment"]["soil_wetness_top"] is None else 1 - r["environment"]["soil_wetness_top"],
        "thermal_extremes": lambda r: None if not r.get("environment") else r["environment"]["annual_span_c"],
        "dust_loading": lambda r: None if not r.get("environment") else r["environment"]["aerosol_optical_depth_550"],
        "life_scarcity": lambda r: None if not r.get("biology") else -r["biology"]["per_1000_km2"],
        "rugged_terrain": lambda r: None if not (r["terrain"].get("metrics")) else r["terrain"]["metrics"]["p90_slope_deg"],
    }
    for name, f in dims.items():
        vals = sorted(v for v in (f(r) for r in rows) if v is not None)
        for r in rows:
            v = f(r)
            r.setdefault("dimensions", {})[name] = None if v is None else sum(x <= v for x in vals) / len(vals)
    out["dimension_definitions"] = {
        "soil_dryness": "1 − GWETTOP (NASA POWER surface soil wetness, 2001–2025), percentile",
        "thermal_extremes": "warmest-month mean daily maximum − coldest-month mean daily minimum (POWER T2M_MAX/T2M_MIN), percentile",
        "dust_loading": "Annual column aerosol optical depth550nm (POWER AOD_55), percentile; not dust-specific, surface deposition or dust entrainment.",
        "life_scarcity": "Inverse recorded GBIF occurrence density, percentile. Measures reporting/sampling, never life scarcity, sterility, habitability or biosignature potential.",
        "rugged_terrain": "90th-percentile 8 km-baseline slope from the SRTM grid, percentile",
    }
    out["rows"] = rows
    out["interpretation"] = "Relative descriptors within this bounded130-cell sample, not planetary similarity scores. POWER air temperature, modeled soil wetness, column aerosols and GBIF reporting are distinct quantities; no ice/cave/biology verification follows."
    cached = []
    for r in rows:
        extra = [x["source_url"] for x in (r.get("environment"), r.get("biology")) if x] + [x["provenance"]["source_url"] for x in r["climate_observations"].values()]
        for url in r["terrain"]["source_urls"] + r["geology"]["source_refs"] + extra:
            import hashlib
            path = CACHE / (hashlib.sha256(url.encode()).hexdigest() + ".json")
            if path.exists():
                rec = json.loads(path.read_text(encoding="utf-8"))
                cached.append({"url": url, "sha256": rec["sha256"], "retrieved_at": rec["retrieved_at"], "file": f"data/cached/{path.name}"})
    out["provenance"] = sorted({c["url"]: c for c in cached}.values(), key=lambda c: c["url"])
    out=stable_science_json(derived / "cell_search.json", out)
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
