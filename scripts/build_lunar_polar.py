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

from science.ingestion.cache import atomic_json, stable_science_json
from science.ingestion.mola import extract_terrain_grid, read_product_metadata
from science.ingestion.lola import LOLA_BASE
from science.analysis.terrain import terrain_metrics
from science.analysis.similarity import physical_fidelity

CONTRACT = "terrainx-lunar-polar-v2"
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


DIVINER_BUNDLE = ROOT / "data" / "source" / "acquisition" / "terrainx-diviner-prp-south-sites.json"
DIVINER_RADIUS_KM = 12.5
COLD_TRAP_K = 110.0  # water-ice cold-trap threshold used by Paige et al. (2010), Science 330, 479


def _gc_km(lat1, lon1, lat2, lon2, r=1737.4):
    import math
    p, q, dl = math.radians(lat1), math.radians(lat2), math.radians(lon2 - lon1)
    h = math.sin((q - p) / 2) ** 2 + math.cos(p) * math.cos(q) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(min(1, math.sqrt(h)))


def diviner_summary() -> dict | None:
    """Per-site statistics from LRO Diviner PRP south triangles (fixed-width columns per its PDS4 label)."""
    if not DIVINER_BUNDLE.exists():
        return None
    from science.ingestion.diviner import validate_label,parse_record,summarize
    bundle = json.loads(DIVINER_BUNDLE.read_text(encoding="utf-8"))
    validate_label(bundle["label_xml"],bundle["label_sha256"])
    verification_path=ROOT/"data/source/diviner/verification.json"
    verification=json.loads(verification_path.read_text(encoding="utf-8")) if verification_path.exists() else None
    if verification and (verification['sha256']!=bundle['sha256'] or verification['published_md5']!=verification['md5']):raise ValueError('Diviner verification mismatch')
    sites = {site['id']:site for site in SITES};per={sid:[] for sid in sites}
    seen=set()
    for line in bundle['records']:
        sid,_dist,raw=line.split('\t',2)
        if (sid,raw) in seen:raise ValueError('Duplicate retained triangle')
        seen.add((sid,raw));record=parse_record(raw);site=sites[sid]
        if _gc_km(site['latitude'],site['longitude'],record['tri_clat'],record['tri_clon'])>DIVINER_RADIUS_KM+1e-6:raise ValueError('Retained triangle outside site support')
        per[sid].append(record)
    return {'product':'LRO Diviner Polar Resource Product south','url':bundle['url'],'bytes':bundle['bytes'],'sha256':bundle['sha256'],
      'label_url':bundle['label_url'],'label_sha256':bundle['label_sha256'],'records_scanned':bundle['records_scanned'],
      'radius_km':DIVINER_RADIUS_KM,'cold_trap_threshold_k':COLD_TRAP_K,'cold_trap_reference':'Paige et al. (2010), Science330,479–482',
      'verification':verification,'classification':'MODEL-DERIVED THERMAL / ICE-STABILITY PRODUCT',
      'notes':'Annual maximum surface temperature and annual average at2cm depth are model products. Ice stability is a sublimation-model depth, not detected ice. Fractions weight actual triangle surface area (centroid-selected, boundary not clipped); medians count triangles equally. Undefined negative ice codes stay unknown. POWER air climatology is not the same physical observable as lunar surface temperature.',
      'sites':{sid:summarize(rows) for sid,rows in per.items()}}



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
    diviner = diviner_summary()
    if diviner:
        for row in sites:
            row["diviner"] = diviner["sites"].get(row["id"])
        diviner = {k: v for k, v in diviner.items() if k != "sites"}
    search = derived / "cell_search.json"
    earth_cold = None
    if search.exists():
        envs = [(r["id"], r["environment"]["coldest_month_min_c"]) for r in json.loads(search.read_text(encoding="utf-8"))["rows"] if r.get("environment") and r["environment"].get("coldest_month_min_c") is not None]
        if envs:
            cid, c = min(envs, key=lambda x: x[1])
            earth_cold = {"cell": cid, "coldest_month_min_c": c, "kelvin": c + 273.15, "source": "NASA POWER T2M_MIN monthly climatology 2001–2025"}
    out = {"contract": CONTRACT, "diviner": diviner, "earth_coldest_cell": earth_cold, "generated_at": datetime.now(timezone.utc).isoformat(), "raster": raster, "label_metadata": {k: metadata[k] for k in ("pixels_per_degree", "map_sphere_radius_m", "height_scale", "acquisition_period") if k in metadata},
           "sources": [{"title": "NASA: Artemis III candidate landing regions (2024-10-28)", "url": ARTEMIS_SOURCE}, {"title": "IAU Gazetteer of Planetary Nomenclature", "url": "https://planetarynames.wr.usgs.gov/"}, {"title": "LRO LOLA LDEM_16 (PDS Geosciences)", "url": raster["url"]}],
           "caveats": ["Diviner values summarise all PRP triangles whose centres lie within 12.5 km of each feature centre; modelled thermal products, not in-situ measurements." , "Feature centres from the IAU Gazetteer, not NASA landing-region polygons.", "LDEM_16 native pixels are ~1.9 km north-south; a 24 km footprint is regional relief only.", "Earth terrain twins compare relief shape (F) only; Earth cannot reproduce polar illumination, permanently shadowed cold traps, vacuum, 1.62 m/s² gravity or lunar regolith."],
           "earth_profiles_compared": len(earth), "sites": sites}
    out=stable_science_json(derived / "lunar_polar.json", out)
    (ROOT / "frontend" / "public" / "data" / "lunar_polar.json").write_text(json.dumps(out, separators=(",", ":"), allow_nan=False, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
