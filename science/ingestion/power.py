"""NASA POWER units and missing-value-aware climatology parsing."""
from __future__ import annotations

import math
import re
from .cache import CachedHTTP

BASE = "https://power.larc.nasa.gov/api/temporal/climatology"
MONTHS = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
PARAMETERS = "PRECTOTCORR,T2M,WS10M,ALLSKY_SFC_SW_DWN,PS,RH2M"


def acquisition_period(header: dict):
    if header.get("start") and header.get("end"):
        return [str(header["start"]),str(header["end"])]
    # Point climatology exposes its actual period as header.range, unlike regional start/end.
    match=re.search(r"January\s+(\d{4})\s*-\s*December\s+(\d{4})",header.get("range",""))
    if match:
        return [match.group(1)+"0101",match.group(2)+"1231"]
    return None


def clean(value, fill_value=-999):
    if value is None or isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) and number != fill_value else None


def annual_precipitation(daily, unit: str):
    value = clean(daily)
    if unit.strip().lower().replace(" ", "") not in {"mm/day", "mmdy-1", "mm/d"}:
        raise ValueError(f"Unsupported precipitation unit: {unit}")
    return None if value is None or value < 0 else 365.25 * value


def parse_regional(record: dict, region_id: str) -> list[dict]:
    data = record["data"]
    unit = data["parameters"]["PRECTOTCORR"]["units"]
    cells = []
    fill = data.get("header", {}).get("fill_value", -999)
    for feature in data.get("features", []):
        lon, lat = feature["geometry"]["coordinates"][:2]
        daily = clean(feature["properties"]["parameter"]["PRECTOTCORR"].get("ANN"), fill)
        annual = annual_precipitation(daily, unit)
        cells.append({"id": f"{region_id}-{lat:.3f}-{lon:.3f}", "region_id": region_id, "latitude": lat, "longitude": lon, "daily_precip_mm": daily, "annual_precip_mm": annual, "aridity": None if annual is None else max(0, min(1, 1 - annual / 400)), "provenance": {"dataset": "NASA POWER / MERRA-2", "source_url": record["url"], "retrieved_at": record["retrieved_at"], "period": acquisition_period(data["header"]), "native_resolution": "0.5° latitude × 0.625° longitude meteorological grid", "original_unit": unit, "converted_unit": "mm/year", "classification": "DERIVED", "sha256": record["sha256"]}, "quality": "valid" if annual is not None else "missing"})
    return cells


def parse_point(record: dict, latitude: float, longitude: float) -> dict:
    data = record["data"]
    header = data.get("header", {})
    result = {}
    for name, values in data["properties"]["parameter"].items():
        meta = data["parameters"][name]
        result[name] = {"value": clean(values.get("ANN"), header.get("fill_value", -999)), "monthly": [clean(values.get(m), header.get("fill_value", -999)) for m in MONTHS], "unit": meta["units"], "long_name": meta.get("longname", name), "provenance": {"dataset": "NASA POWER", "source_url": record["url"], "retrieved_at": record["retrieved_at"], "period": acquisition_period(header), "native_resolution": "MERRA-2 meteorology 0.5° × 0.625°; CERES solar 1° × 1°", "latitude": latitude, "longitude": longitude, "original_unit": meta["units"], "classification": "MEASURED", "note": "Gridded reanalysis/satellite-derived climatology, not an outcrop instrument measurement.", "sha256": record["sha256"]}}
    precip = result.get("PRECTOTCORR")
    result["annual_precip_mm"] = annual_precipitation(precip["value"], precip["unit"]) if precip else None
    temperatures = result.get("T2M", {}).get("monthly", [])
    result["seasonal_temperature_range_c"] = max(temperatures) - min(temperatures) if len(temperatures) == 12 and all(v is not None for v in temperatures) else None
    return result


def fetch_regional(client: CachedHTTP, region: dict):
    west, south, east, north = region["bounds"]
    return client.get(BASE + "/regional", {"latitude-min": south, "latitude-max": north, "longitude-min": west, "longitude-max": east, "parameters": "PRECTOTCORR", "community": "AG", "format": "JSON"})


def fetch_point(client: CachedHTTP, latitude: float, longitude: float):
    return client.get(BASE + "/point", {"latitude": latitude, "longitude": longitude, "parameters": PARAMETERS, "community": "AG", "format": "JSON"})
