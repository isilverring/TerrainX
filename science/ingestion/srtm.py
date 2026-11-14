"""NASA SRTM via OpenTopoData: lat/lon batching, rate limit, cached responses."""
from __future__ import annotations
import math
from .cache import CachedHTTP
from .power import clean

ENDPOINT = "https://api.opentopodata.org/v1/srtm90m"
EARTH_RADIUS_M = 6_371_000


def grid_coordinates(latitude: float, longitude: float, size: int = 7, spacing_m: float = 4000) -> list[tuple[float, float]]:
    if size < 3 or size % 2 == 0 or spacing_m <= 0 or abs(latitude) >= 60:
        raise ValueError("Need odd grid >=3, positive spacing, and SRTM coverage below 60°")
    step_lat = math.degrees(spacing_m / EARTH_RADIUS_M)
    step_lon = step_lat / math.cos(math.radians(latitude))
    half = size // 2
    return [(round(latitude + (row-half)*step_lat, 7), round(longitude + (col-half)*step_lon, 7)) for row in range(size) for col in range(size)]


def batches(values: list, size: int = 100):
    if not 1 <= size <= 100:
        raise ValueError("OpenTopoData max 100 locations per request")
    return [values[i:i+size] for i in range(0, len(values), size)]


def sample_grid(client: CachedHTTP, latitude: float, longitude: float) -> dict:
    coordinates = grid_coordinates(latitude, longitude)
    elevations, sources = [], []
    for batch in batches(coordinates):
        record = client.get(ENDPOINT, {"locations": "|".join(f"{lat},{lon}" for lat, lon in batch), "interpolation": "bilinear", "nodata_value": "null"}, interval=1.05)
        if record["data"].get("status") != "OK":
            raise ValueError("SRTM service did not return OK")
        results = record["data"]["results"]
        if len(results) != len(batch):
            raise ValueError("SRTM response count mismatch")
        for expected, actual in zip(batch, results):
            loc = actual["location"]
            if abs(loc["lat"]-expected[0]) > 1e-5 or abs(loc["lng"]-expected[1]) > 1e-5:
                raise ValueError("SRTM response coordinate mismatch")
            elevations.append(clean(actual.get("elevation")))
        sources.append({"dataset": "NASA SRTM / OpenTopoData srtm90m", "source_url": record["url"], "retrieved_at": record["retrieved_at"], "period": "SRTM acquisition February 2000; service mosaic", "original_unit": "m", "classification": "MEASURED", "native_resolution": "approximately 90 m (3 arc-second)", "sha256": record["sha256"]})
    return {"status": "available", "elevations_m": [elevations[i:i+7] for i in range(0,49,7)], "sample_spacing_m": 4000, "footprint_m": 24000, "native_resolution_m": {"x": 90, "y": 90}, "resampling": "OpenTopoData bilinear sample; no smoothing; 4 km point grid", "provenance": sources, "coordinate_order": "rows south-to-north, columns west-to-east", "note": "24×24 km broad regional sample footprint; not a 90 m analysis grid or rover hazard survey."}
