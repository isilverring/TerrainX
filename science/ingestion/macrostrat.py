"""Mapped unit evidence, never inferred field-confirmed mineralogy."""
from .cache import CachedHTTP

ENDPOINT="https://macrostrat.org/api/geologic_units/map"


def fetch_geology(client: CachedHTTP, latitude:float, longitude:float) -> dict:
    record=client.get(ENDPOINT,{"lat":latitude,"lng":longitude,"format":"json"})
    success=record["data"].get("success",{})
    units=success.get("data",[])
    return {"status":"mapped" if units else "unavailable", "units":units,"references":success.get("refs",{}),"source_refs":[record["url"]],"retrieved_at":record["retrieved_at"],"classification":"LITERATURE-SUPPORTED","caution":"Mapped lithology, not confirmed local mineralogy. Polygon scale and positional uncertainty may exceed the proposed subsite."}


def classify_geology(geology:dict, mission:str) -> dict:
    refs=geology.get("source_refs",[])
    units=geology.get("units",[])
    # Do not combine unrelated polygons into a direct match: prefer best mapped unit, retain all raw units.
    unit=units[0] if units else {}
    text=" ".join(str(unit.get(k,"")) for k in ("name","lith","descrip")).lower()
    value=None
    rationale="Geology requires verification. No specific matching mapped material/process established."
    if mission=="mare-crisium" and "basalt" in text:
        value=1.
        rationale="Map description explicitly includes basalt; supports a preliminary basalt sampling hypothesis, not uniform or field-confirmed basalt."
    elif mission=="jezero" and any(word in text for word in ("lacustrine","lake deposits","limestone","carbonate","dolomite")):
        value=.5
        rationale="Mapped carbonate or lacustrine context gives partial material/process relevance; depositional setting and preservation need local verification."
    elif mission=="jezero" and any(word in text for word in ("sediment","sandstone","siltstone","mudstone","alluvium")):
        value=.5
        rationale="Mapped sedimentary material gives partial fieldwork relevance; no Jezero-equivalent lake, delta, carbonate or biosignature claim."
    return {"value":value,"rationale":rationale,"source_refs":refs if value is not None else [],"classification":"LITERATURE-SUPPORTED" if value is not None else "UNAVAILABLE"}
