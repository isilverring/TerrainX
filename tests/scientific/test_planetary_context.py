"""The visualisation-only context windows must agree with the scoring pipeline."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from science.ingestion.planetary_context import WINDOWS, load_window, parse_window_csv, window_csv_text, verify_raster

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "data" / "source" / "planetary"
# SHA-256 of each committed window text, recorded from the browser extraction that
# also matched the whole-raster checksums in manifest.json.
WINDOW_SHA = {
    "jezero": "d98addf88a2a17155ea5cfb88bd9adafce5543d9c30f6d8e8202ca3e7756399f",
    "mare-crisium": "803badee583ad7bf3c131613584687353be35a2ed4fdc88cf872454ee7af710f",
}


@pytest.mark.parametrize("target_id", sorted(WINDOWS))
def test_window_checksum_and_shape(target_id):
    window, info = load_window(SOURCE, WINDOWS[target_id])
    assert info["window_sha256"] == WINDOW_SHA[target_id]
    assert len(window.values) == WINDOWS[target_id].rows


@pytest.mark.parametrize("target_id", sorted(WINDOWS))
def test_window_contains_the_committed_native_samples(target_id):
    window, _ = load_window(SOURCE, WINDOWS[target_id])
    native = json.loads((SOURCE / f"{target_id}-native-samples.json").read_text(encoding="utf-8"))
    for sample in native["samples"]:
        assert window.dn_at(sample["row"], sample["column"]) == sample["dn"]


@pytest.mark.parametrize("target_id", sorted(WINDOWS))
def test_window_reproduces_the_scored_7x7_grid_exactly(target_id):
    window, _ = load_window(SOURCE, WINDOWS[target_id])
    targets = json.loads((ROOT / "data" / "derived" / "planetary_targets.json").read_text(encoding="utf-8"))
    expected = next(t for t in targets if t["id"] == target_id)["terrain"]["elevations_m"]
    assert window.grid(4000, 3) == expected


def test_context_grid_is_visualisation_only_and_complete():
    context = json.loads((ROOT / "data" / "derived" / "planetary_context.json").read_text(encoding="utf-8"))
    assert {t["target_id"] for t in context["targets"]} == set(WINDOWS)
    for target in context["targets"]:
        assert target["classification"].startswith("VISUALISATION ONLY")
        assert target["grid_shape"] == [49, 49] and target["extent_m"] == 96000
        assert all(len(row) == 49 and all(v is not None for v in row) for row in target["elevations_m"])


def test_window_outside_bounds_is_refused():
    window, _ = load_window(SOURCE, WINDOWS["jezero"])
    with pytest.raises(ValueError):
        window.dn_at(0, 0)


def test_csv_round_trip():
    spec = WINDOWS["jezero"]
    text = (SOURCE / spec.csv_name).read_text(encoding="utf-8").strip()
    assert window_csv_text(parse_window_csv(text, spec)) == text


def test_source_manifest_rejects_same_size_modified_raster(tmp_path):
    import hashlib
    image = tmp_path / "raster.img"
    image.write_bytes(b"verified")
    record = {"bytes": 8, "sha256": hashlib.sha256(b"verified").hexdigest()}
    verify_raster(image, record)
    image.write_bytes(b"modified")
    with pytest.raises(ValueError, match="SHA-256"):
        verify_raster(image, record)


def test_fallback_window_rejects_modified_pixel(tmp_path):
    import shutil
    spec = WINDOWS["jezero"]
    for name in (spec.label_xml, spec.label_pds3, spec.csv_name):
        shutil.copyfile(SOURCE / name, tmp_path / name)
    path = tmp_path / spec.csv_name
    values = parse_window_csv(path.read_text(), spec)
    values[0][0] += 1
    path.write_text(window_csv_text(values))
    with pytest.raises(ValueError, match="SHA-256"):
        load_window(tmp_path, spec)
