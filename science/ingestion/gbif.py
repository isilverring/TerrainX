"""GBIF occurrence counts per screened cell: documented-biology proxy, never habitability proof."""
from .cache import CachedHTTP

ENDPOINT = "https://api.gbif.org/v1/occurrence/search"
HALF_LAT, HALF_LON = 0.25, 0.3125  # NASA POWER cell: 0.5° latitude × 0.625° longitude


def cell_box(latitude: float, longitude: float) -> tuple[float, float, float, float]:
    return latitude - HALF_LAT, latitude + HALF_LAT, longitude - HALF_LON, longitude + HALF_LON


def fetch_occurrence_count(client: CachedHTTP, latitude: float, longitude: float) -> dict:
    s, n, w, e = cell_box(latitude, longitude)
    record = client.get(ENDPOINT, {"decimalLatitude": f"{s},{n}", "decimalLongitude": f"{w},{e}", "hasCoordinate": "true", "hasGeospatialIssue": "false", "limit": 0})
    return {"count": record["data"]["count"], "source_url": record["url"], "retrieved_at": record["retrieved_at"], "sha256": record["sha256"]}
