"""Cache verified NASA display images unchanged for reliable audience demos."""
from __future__ import annotations
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sys
import httpx

ROOT = Path(__file__).resolve().parents[1]
IMAGES = [
    ("salda.jpg", "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/147000/147041/lakesalda_oli_2020159_lrg.jpg?w=1280", "https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/", "NASA Earth Observatory / Lauren Dauphin / USGS Landsat 8 OLI"),
    ("jezero.jpg", "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/147000/147041/20171204_JezeroCTXMosaic.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg", "https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/", "NASA / JPL-Caltech / MSSS / Tanya Harrison; MRO CTX"),
    ("khaybar.jpg", "https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/152000/152839/harratkhaybarzm_oli2_20240425.jpg?w=1280", "https://science.nasa.gov/earth/earth-observatory/white-and-black-volcanoes-of-saudi-arabia-152839", "NASA Earth Observatory / Lauren Dauphin / USGS Landsat 9 OLI-2"),
    ("crisium.png", "https://assets.science.nasa.gov/dynamicimage/assets/science/psd/lunar-science/2023/08/wrinkle-ridge-mare-crisium.png?w=1000", "https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/", "NASA / GSFC / Arizona State University"),
]

def main():
    folder = ROOT / "frontend/public/nasa"
    folder.mkdir(parents=True, exist_ok=True)
    manifest = folder / "imagery-manifest.json"
    saved = json.loads(manifest.read_text()) if manifest.exists() else {"images": []}
    records = []
    with httpx.Client(timeout=45, follow_redirects=True) as client:
        for filename, url, page, credit in IMAGES:
            path = folder / filename
            previous = next((r for r in saved["images"] if r["file"] == filename), None)
            if path.exists() and previous and hashlib.sha256(path.read_bytes()).hexdigest() == previous["sha256"]:
                records.append(previous)
                continue
            response = client.get(url)
            response.raise_for_status()
            mime = response.headers.get("content-type", "").split(";")[0]
            if mime not in ("image/jpeg", "image/png") or len(response.content) > 10_000_000:
                raise ValueError("Expected a bounded NASA JPEG/PNG display image")
            path.write_bytes(response.content)
            records.append({"file": filename, "source_url": url, "source_page": page, "credit": credit,
                "retrieved_at": datetime.now(timezone.utc).isoformat(), "bytes": len(response.content),
                "sha256": hashlib.sha256(response.content).hexdigest(), "content_type": mime,
                "transformation": "None locally. Cached NASA-served display rendition, not a scientific raster or a source of scores."})
            print(f"Cached {filename}: {len(response.content)} bytes")
    manifest.write_text(json.dumps({"organization": "NASA (with stated mission/USGS collaborators)", "images": records}, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
