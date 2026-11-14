"""Deterministic separated NASA precipitation-cell shortlist."""
import math


def distance_km(a,b):
    p,q=math.radians(a["latitude"]),math.radians(b["latitude"])
    dl=math.radians(b["longitude"]-a["longitude"])
    h=math.sin((q-p)/2)**2+math.cos(p)*math.cos(q)*math.sin(dl/2)**2
    return 6371*2*math.asin(min(1,math.sqrt(h)))


def select_candidates(cells: list[dict], per_region=4, separation_km=65) -> list[dict]:
    selected=[]
    for region in sorted({c["region_id"] for c in cells}):
        candidates=sorted((c for c in cells if c["region_id"]==region and c["aridity"] is not None),key=lambda c:(-c["aridity"],c["latitude"],c["longitude"]))
        regional=[]
        for cell in candidates:
            if all(distance_km(cell,other)>=separation_km for other in regional):
                regional.append(cell)
            if len(regional)==per_region:
                break
        selected.extend(regional)
    return selected


def discovery_count(candidates):
    return sum(not c.get("benchmark",False) for c in candidates)
