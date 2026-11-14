"""Exploratory physical fidelity, gated on real data and comparable scales."""
from __future__ import annotations
import math

TOLERANCES = {"median_slope_deg": 3., "p90_slope_deg": 5., "relief_m": 150., "detrended_rms_m": 75.}


def feature_similarity(earth: float, planet: float, tolerance: float) -> float:
    if tolerance <= 0 or not all(math.isfinite(v) for v in (earth,planet,tolerance)):
        raise ValueError("Finite values and positive tolerance required")
    return math.exp(-.5*((earth-planet)/tolerance)**2)


def scales_compatible(earth: dict | None, planet: dict | None) -> bool:
    if not earth or not planet or earth.get("status") != "available" or planet.get("status") != "available":
        return False
    for key in ("sample_spacing_m", "footprint_m"):
        a,b = earth.get(key,0),planet.get(key,0)
        if not a or not b or abs(a-b)/max(a,b)>.05:
            return False
    for profile in (earth,planet):
        native = profile.get("native_resolution_m", {})
        if not native or max(native.values()) > profile["sample_spacing_m"]*1.05:
            return False
        if not profile.get("provenance") or not profile.get("metrics"):
            return False
    return True


def physical_fidelity(earth: dict | None, planet: dict | None) -> dict:
    if not scales_compatible(earth, planet):
        return {"value": None, "reason": "Insufficient compatible terrain data", "components": [], "classification": "UNAVAILABLE"}
    components = []
    for key,tolerance in TOLERANCES.items():
        e,p = earth["metrics"].get(key),planet["metrics"].get(key)
        if e is None or p is None:
            continue
        components.append({"feature": key,"earth":e,"planet":p,"tolerance":tolerance,"similarity":feature_similarity(e,p,tolerance),"weight":.25})
    if len(components)!=4:
        return {"value":None,"reason":"Missing required terrain feature","components":components,"classification":"UNAVAILABLE"}
    return {"value":100*sum(c["similarity"] for c in components)/len(components),"reason":None,"components":components,"classification":"DERIVED","warning":"Common4km sample spacing and8km slope baseline; unequal native support (~90m SRTM versus kilometer-scale planetary pixels), bilinear interpolation and no matched area averaging can bias this exploratory comparison. This is not scale equivalence or mission-safety validation.","source_refs": [s["source_url"] for p in (earth,planet) for s in (p["provenance"] if isinstance(p["provenance"],list) else [p["provenance"]])]}
