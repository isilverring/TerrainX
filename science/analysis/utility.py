"""Declared experiment heuristics, missing-data coverage, and geology gating."""
from __future__ import annotations
import math

WEIGHTS = {"jezero": {"geology":.55,"terrain":.20,"aridity":.15,"temperature":.10}, "mare-crisium":{"geology":.55,"terrain":.30,"aridity":.10,"temperature":.05}}


def validate_weights(weights):
    if any(v<0 for v in weights.values()) or not math.isclose(sum(weights.values()),1,abs_tol=1e-9):
        raise ValueError("Mission weights must be nonnegative and sum to1")


def mission_utility(criteria: dict, mission: str, *, benchmark=False, weights=None) -> dict:
    chosen=weights or WEIGHTS[mission]
    validate_weights(chosen)
    assessed=[]
    for key,weight in chosen.items():
        criterion=criteria.get(key,{})
        value=criterion.get("value")
        if value is not None:
            if not math.isfinite(value) or not 0<=value<=1 or not criterion.get("source_refs"):
                raise ValueError("Assessed criteria need a finite0..1 value and provenance")
            assessed.append((key,weight,value))
    coverage=sum(weight for _,weight,_ in assessed)
    utility=100*sum(weight*value for _,weight,value in assessed)/coverage if coverage else None
    geology=criteria.get("geology",{}).get("value")
    status="REFERENCE ANALOG" if benchmark else "CHARACTERIZED CANDIDATE" if coverage>=.70 and geology is not None and geology>=.5 else "SCREENED CANDIDATE"
    return {"value":utility,"coverage":coverage,"weights":chosen,"criteria":criteria,"status":status,"evidence_label":"Sufficient for preliminary hypothesis" if coverage>=.70 and geology is not None else "Insufficient evidence","classification":"ASSUMED","note":"Model-based Earth experiment suitability; weighted available criteria. Coverage is assessed weight, not confidence or measurement accuracy."}


def combined_priority(fidelity, utility, alpha, gamma=1):
    if fidelity is None or utility["value"] is None or utility["coverage"]<.70 or utility["criteria"].get("geology",{}).get("value") is None:
        return None
    return (alpha*fidelity+(1-alpha)*utility["value"])*utility["coverage"]**gamma
