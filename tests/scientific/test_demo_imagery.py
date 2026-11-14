"""Bundled demo imagery stays identical to the attributed NASA responses."""
import hashlib
import json
from pathlib import Path
import pytest

FOLDER = Path(__file__).resolve().parents[2] / "frontend/public/nasa"
MANIFEST = json.loads((FOLDER / "imagery-manifest.json").read_text(encoding="utf-8"))

@pytest.mark.parametrize("entry", MANIFEST["images"], ids=lambda e: e["file"])
def test_bundled_nasa_image_integrity_and_attribution(entry):
    body = (FOLDER / entry["file"]).read_bytes()
    assert len(body) == entry["bytes"]
    assert hashlib.sha256(body).hexdigest() == entry["sha256"]
    assert entry["source_url"].startswith("https://assets.science.nasa.gov/")
    assert entry["source_page"].startswith("https://science.nasa.gov/")
    assert entry["credit"] and entry["retrieved_at"]
    assert entry["transformation"].startswith("None locally")
