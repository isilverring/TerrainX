"""Atomic, content-addressed HTTP cache with reproducible provenance."""
from __future__ import annotations

import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "data" / "cached"


def atomic_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, allow_nan=False, ensure_ascii=False), encoding="utf-8")
    os.replace(temporary, path)


class CachedHTTP:
    def __init__(self, offline: bool = False):
        self.offline = offline
        self.last_request: dict[str, float] = {}
        self.client = httpx.Client(timeout=90, follow_redirects=True, headers={"User-Agent": "TerrainX-science/1.0 (independent research)"})

    def get(self, endpoint: str, params: dict | None = None, *, interval: float = 0) -> dict:
        request = self.client.build_request("GET", endpoint, params=params)
        url = str(request.url)
        digest = hashlib.sha256(url.encode()).hexdigest()
        path = CACHE / (digest + ".json")
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        if self.offline:
            raise RuntimeError(f"No cached response for {url}")
        host = request.url.host
        error = None
        for attempt in range(3):
            wait = interval - (time.monotonic() - self.last_request.get(host, 0))
            if wait > 0:
                time.sleep(wait)
            self.last_request[host] = time.monotonic()
            try:
                response = self.client.send(request)
                response.raise_for_status()
                data = response.json()
                record = {"url": url, "retrieved_at": datetime.now(timezone.utc).isoformat(), "sha256": hashlib.sha256(response.content).hexdigest(), "status_code": response.status_code, "data": data}
                atomic_json(path, record)
                return record
            except (httpx.HTTPError, ValueError) as exc:
                error = exc
                time.sleep(min(2 ** attempt, 8))
        raise RuntimeError(f"HTTP acquisition failed: {url}: {error}")
