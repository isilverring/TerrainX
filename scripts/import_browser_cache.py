r"""Import raw API responses fetched by a browser into the content-addressed cache.

Used when the build machine cannot reach a public API but a browser can. Each record
must carry the exact request URL, the retrieval time, the HTTP status, the SHA-256 of the
raw response bytes and the raw body text. The importer re-hashes the body (UTF-8) and
refuses any record whose hash differs, so cached data are byte-identical to what the
service returned. Records are written in exactly the CachedHTTP format, keyed by
SHA-256(url), so the unmodified pipeline then runs fully offline.

Usage: python scripts/import_browser_cache.py bundle.json [bundle2.json ...]
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from science.ingestion.cache import CACHE, atomic_json

ALLOWED = ("https://api.opentopodata.org/v1/srtm90m?", "https://macrostrat.org/api/geologic_units/map?", "https://power.larc.nasa.gov/api/temporal/climatology/point?", "https://api.gbif.org/v1/occurrence/search?")


def import_bundle(path: Path) -> tuple[int, int]:
    bundle = json.loads(path.read_text(encoding="utf-8"))
    records = bundle["records"] if isinstance(bundle, dict) else bundle
    written = skipped = 0
    for rec in records:
        url = rec["url"]
        if not url.startswith(ALLOWED):
            raise ValueError(f"Unexpected source URL: {url[:80]}")
        body = rec["body"].encode("utf-8")
        digest = hashlib.sha256(body).hexdigest()
        if digest != rec["sha256"] or len(body) != rec["bytes"]:
            raise ValueError(f"Body hash/length mismatch for {url[:80]}")
        if rec["status_code"] != 200:
            raise ValueError(f"Non-200 response recorded for {url[:80]}")
        target = CACHE / (hashlib.sha256(url.encode()).hexdigest() + ".json")
        if target.exists():
            skipped += 1
            continue
        atomic_json(target, {"url": url, "retrieved_at": rec["retrieved_at"], "sha256": digest, "status_code": 200, "data": json.loads(body), "acquired_via": "browser fetch (laptop built-in browser); body bytes re-hashed on import"})
        written += 1
    return written, skipped


if __name__ == "__main__":
    for name in sys.argv[1:]:
        w, s = import_bundle(Path(name))
        print(f"{name}: imported {w}, already cached {s}")
