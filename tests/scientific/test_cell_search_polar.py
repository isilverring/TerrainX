"""130-cell mission-aware search and lunar south-polar module: provenance and rules."""
import hashlib
import json
from pathlib import Path

import pytest

from science.analysis.discovery import distance_km
from science.analysis.similarity import physical_fidelity

ROOT = Path(__file__).resolve().parents[2]
DERIVED = ROOT / "data" / "derived"
SEARCH = json.loads((DERIVED / "cell_search.json").read_text(encoding="utf-8"))
POLAR = json.loads((DERIVED / "lunar_polar.json").read_text(encoding="utf-8"))
DATASET = json.loads((DERIVED / "dataset.json").read_text(encoding="utf-8"))
ROWS = {r["id"]: r for r in SEARCH["rows"]}


def test_every_screened_cell_is_characterized_once():
    cells = json.loads((DERIVED / "screened_cells.geojson").read_text(encoding="utf-8"))["features"]
    assert sorted(ROWS) == sorted(f["properties"]["id"] for f in cells)
    assert SEARCH["contract"] == "terrainx-cell-search-v1"
    assert not SEARCH["errors"]


def test_fidelity_matches_the_released_candidates_exactly():
    for c in DATASET["candidates"]:
        if c["benchmark"]:
            continue
        for mission, a in c["assessments"].items():
            assert ROWS[c["id"]]["missions"][mission]["F"] == pytest.approx(a["fidelity"]["value"], abs=1e-9)


def test_missing_evidence_is_never_scored_and_temperature_stays_missing():
    for r in SEARCH["rows"]:
        for m in r["missions"].values():
            assert m["criteria"]["temperature"] is None
            if m["criteria"]["geology"] is None:
                assert m["P"] is None and m["rank"] is None and m["reason"]


def test_shortlists_respect_region_quota_and_separation():
    for mission in SEARCH["missions"].values():
        chosen = [ROWS[i] for i in mission["shortlist"]]
        for region in {r["region_id"] for r in chosen}:
            regional = [r for r in chosen if r["region_id"] == region]
            assert len(regional) <= 4
            for i, a in enumerate(regional):
                for b in regional[i + 1:]:
                    assert distance_km(a, b) >= 65
        assert set(mission["new_vs_release"]).isdisjoint(SEARCH["released_shortlist"])


@pytest.mark.parametrize("name", ["terrainx-cells-srtm.json", "terrainx-cells-macrostrat.json"])
def test_browser_bundles_match_cache_records(name):
    bundle = json.loads((ROOT / "data/source/acquisition" / name).read_text(encoding="utf-8"))
    assert len(bundle["records"]) == 114
    for rec in bundle["records"]:
        body = rec["body"].encode("utf-8")
        assert hashlib.sha256(body).hexdigest() == rec["sha256"]
        cached = json.loads((ROOT / "data/cached" / (hashlib.sha256(rec["url"].encode()).hexdigest() + ".json")).read_text(encoding="utf-8"))
        assert cached["sha256"] == rec["sha256"] and cached["data"] == json.loads(body)


def test_polar_raster_matches_the_pinned_lola_checksum():
    manifest = json.loads((ROOT / "data/source/planetary/manifest.json").read_text(encoding="utf-8"))
    pinned = next(s for s in manifest["sources"] if s["file"] == "ldem_16.img")
    assert POLAR["raster"]["sha256"] == pinned["sha256"] == POLAR["raster"]["pinned_sha256"]
    assert POLAR["raster"]["bytes"] == pinned["bytes"]


def test_polar_sites_and_terrain_twins_are_reproducible():
    assert len(POLAR["sites"]) == 8
    for site in POLAR["sites"]:
        assert site["gazetteer_url"].endswith(str(site["iau_id"]))
        assert site["status"] == "available"
        twins = site["earth_twins"]
        assert [t["F"] for t in twins] == sorted((t["F"] for t in twins), reverse=True)
        best = twins[0]
        earth = {"status": "available", "sample_spacing_m": 4000, "footprint_m": 24000, "native_resolution_m": {"x": 90, "y": 90}, "metrics": best["earth_metrics"], "provenance": [{"source_url": "x"}]}
        assert physical_fidelity(earth, site["terrain"])["value"] == pytest.approx(best["F"], abs=1e-9)
