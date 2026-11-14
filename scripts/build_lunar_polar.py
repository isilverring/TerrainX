r"""Lunar south-polar terrain module (terrainx-lunar-polar-v1).

Samples NASA LRO LOLA LDEM_16 at the IAU Gazetteer centres of the named features that
give their names to NASA's nine Artemis III candidate landing regions (announced
2024-10-28), plus Shackleton as a reference. These centres are NOT the landing-region
polygons, which NASA has not published as coordinates; a 24 km footprint at a crater
centre mostly samples its floor and walls, not a specific rim landing site.

Data integrity: the script refuses to run unless data/source/planetary/ldem_16.img has
exactly the byte length and SHA-256 pinned in data/source/planetary/manifest.json, and it
validates the PDS3/PDS4 labels with the pipeline's own `read_product_metadata` before
decoding through the unchanged `extract_terrain_grid` (bilinear, 7x7, 4 km offsets on
the label radius). Earth terrain twins reuse `physical_fidelity` (F only): terrain
resemblance says nothing about polar illumination, cold traps, regolith or volatiles.

Run: python scripts/build_lunar_polar.py
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from science.ingestion.cache import atomic_json
from science.ingestion.mola import extract_terrain_grid, read_product_metadata
from science.ingestion.lola import LOLA_BASE
from science.analysis.terrain import terrain_metrics
from science.analysis.similarity import physical_fidelity

CONTRACT = "terrainx-lunar-polar-v1"
GAZETTEER = "https://planetarynames.wr.usgs.gov/Feature/{id}"
ARTEMIS_SOURCE = "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/"
# IAU Gazetteer of Planetary Nomenclature (planetocentric, +East, -180..180), retrieved 2026-11-14.
SITES = [
    {"id": "cabeus-b", "feature": "Cabeus B", "iau_id": 8058, "diameter_km": 59.62, "latitude": -82.26, "longitude": -54.58, "artemis_region": "Peak near Cabeus B"},
    {"id": "haworth", "feature": "Haworth", "iau_id": 14502, "diameter_km": 51.42, "latitude": -87.45, "longitude": -5.17, "artemis_region": "Haworth"},
    {"id": "mons-malapert", "feature": "Mons Malapert", "iau_id": 16338, "diameter_km": 67.0, "latitude": -85.98, "longitude": -1.67, "artemis_region": "Malapert Massif"},
    {"id": "mons-mouton", "feature": "Mons Mouton", "iau_id": 16070, "diameter_km": 130.0, "latitude": -84.60, "longitude": 31.00, "artemis_region": "Mons Mouton; Mons Mouton Plateau"},
    {"id": "nobile", "feature": "Nobile", "iau_id": 4321, "diameter_km": 79.27, "latitude": -85.28, "longitude": 53.27, "artemis_region": "Nobile Rim 1; Nobile Rim 2"},
    {"id": "de-gerlache", "feature": "de Gerlache", "iau_id": 1439, "diameter_km": 32.71, "latitude": -88.48, "longitude": -88.34, "artemis_region": "de Gerlache Rim 2"},
    {"id": "slater", "feature": "Slater", "iau_id": 15325, "diameter_km": 25.12, "latitude": -88.08, "longitude": 111.29, "artemis_region": "Slater Plain"},
    {"id": "shackleton", "feature": "Shackleton", "iau_id": 5450, "diameter_km": 20.92, "latitude": -89.67, "longitude": 129.78, "artemis_region": None},
]


def verify_raster(planetary: Path) -> dict:
    manifest = json.loads((planetary / "manifest.json").read_text(encoding="utf-8"))
    pinned = next(s for s in manifest["sources"] if s["file"] == "ldem_16.img")
    image = planetary / "ldem_16.img"
    if not image.exists():
        raise SystemExit("ldem_16.img missing: download it from " + LOLA_BASE + "ldem_16.img")
    data = image.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if len(data) != pinned["bytes"] or digest != pinned["sha256"]:
        raise SystemExit(f"ldem_16.img does not match the pinned checksum ({len(data)} bytes, {digest})")
    return {"url": pinned["url"], "bytes": pinned["bytes"], "sha256": digest, "pinned_sha256": pinned["sha256"], "verified_at": datetime.now(timezone.utc).isoformat()}


def earth_profiles(derived: Path) -> list[dict]:
    """Every Earth terrain profile already in the repo: released candidates/benchmarks and the 130-cell search."""
    dataset = json.loads((derived / "dataset.json").read_text(encoding="utf-8"))
    out = {}
    for c in dataset["candidates"]:
        if c["terrain"].get("status") == "available":
            out[c["id"]] = {"id": c["id"], "name": c["name"], "kind": "reference analog" if c["benchmark"] else "released candidate", "region_id": c["region_id"], "latitude": c["latitude"], "longitude": c["longitude"], "terrain": c["terrain"]}
    search = derived / "cell_search.json"
    if search.exists():
        for r in json.loads(search.read_text(encoding="utf-8"))["rows"]:
            t = r["terrain"]
            if t["status"] != "available" or r["id"] in out:
                continue
            out[r["id"]] = {"id": r["id"], "name": r["id"], "kind": "screened cell", "region_id": r["region_id"], "latitude": r["latitude"], "longitude": r["longitude"],
                            "terrain": {"status": "available", "sample_spacing_m": t["sample_spacing_m"], "footprint_m": t["footprint_m"], "native_resolution_m": t["native_resolution_m"], "metrics": t["metrics"], "provenance": [{"source_url": u} for u in t["source_urls"]]}}
    return list(out.values())


def main() -> None:
    planetary = ROOT / "data" / "source" / "planetary"
    derived = ROOT / "data" / "derived"
    raster = verify_raster(planetary)
    metadata = read_product_metadata(planetary / "ldem_16.xml", planetary / "ldem_16.lbl")
    earth = earth_profiles(derived)
    sites = []
    for site in SITES:
        row = {**site, "gazetteer_url": GAZETTEER.format(id=site["iau_id"])}
        try:
            terrain, native = extract_terrain_grid(planetary / "ldem_16.img", metadata, site["latitude"], site["longitude"])
            terrain["metrics"] = terrain_metrics(terrain["elevations_m"], terrain["sample_spacing_m"])
            terrain["provenance"] = [{"source_url": raster["url"], "sha256": raster["sha256"]}]
            twins = []
            for e in earth:
                f = physical_fidelity(e["terrain"], terrain)
                if f["value"] is not None:
                    twins.append({"id": e["id"], "name": e["name"], "kind": e["kind"], "region_id": e["region_id"], "F": f["value"], "components": {c["feature"]: round(c["similarity"], 4) for c in f["components"]}, "earth_metrics": e["terrain"]["metrics"]})
            twins.sort(key=lambda t: (-t["F"], t["id"]))
            row.update(status="available", terrain={k: terrain[k] for k in ("status", "elevations_m", "sample_spacing_m", "footprint_m", "native_resolution_m", "metrics", "provenance", "resampling", "measurement_scale")},
                       native_samples=len(native["samples"]), earth_twins=twins[:12], earth_compared=len(twins))
        except Exception as exc:  # recorded, never filled in
            row.update(status="unavailable", reason=str(exc))
        sites.append(row)
        print(site["feature"], row["status"], row.get("reason", "") or f"relief {row['terrain']['metrics']['relief_m']:.0f} m, best Earth F {row['earth_twins'][0]['F']:.1f}" if row["status"] == "available" else row.get("reason"))
    out = {"contract": CONTRACT, "generated_at": datetime.now(timezone.utc).isoformat(), "raster": raster, "label_metadata": {k: metadata[k] for k in ("pixels_per_degree", "map_sphere_radius_m", "height_scale", "acquisition_period") if k in metadata},
           "sources": [{"title": "NASA: Artemis III candidate landing regions (2024-10-28)", "url": ARTEMIS_SOURCE}, {"title": "IAU Gazetteer of Planetary Nomenclature", "url": "https://planetarynames.wr.usgs.gov/"}, {"title": "LRO LOLA LDEM_16 (PDS Geosciences)", "url": raster["url"]}],
           "caveats": ["Feature centres from the IAU Gazetteer, not NASA landing-region polygons.", "LDEM_16 native pixels are ~1.9 km north-south; a 24 km footprint is regional relief only.", "Earth terrain twins compare relief shape (F) only; Earth cannot reproduce polar illumination, permanently shadowed cold traps, vacuum, 1.62 m/s² gravity or lunar regolith."],
           "earth_profiles_compared": len(earth), "sites": sites}
    atomic_json(derived / "lunar_polar.json", out)
    atomic_json(ROOT / "frontend" / "public" / "data" / "lunar_polar.json", out)


if __name__ == "__main__":
    main()
