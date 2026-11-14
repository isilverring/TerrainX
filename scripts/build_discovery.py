"""Run real NASA screening and cached characterization; writes static app data.

Usage from project root: .venv/Scripts/python scripts/build_discovery.py [--offline]
Every completed candidate is written as a resumable intermediate checkpoint.
"""
from __future__ import annotations
import argparse
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from science.ingestion.cache import CachedHTTP, atomic_json
from science.ingestion.power import fetch_regional,parse_regional,fetch_point,parse_point
from science.ingestion.srtm import sample_grid
from science.ingestion.macrostrat import fetch_geology,classify_geology
from science.analysis.terrain import terrain_metrics
from science.analysis.discovery import select_candidates,discovery_count,on_land
from science.analysis.similarity import physical_fidelity
from science.analysis.utility import mission_utility,combined_priority
from science.models import Dataset

REGIONS=[
    {"id":"saudi","name":"Western Saudi Arabia","bounds":[38,24,41,26],"rationale":"Western Arabian volcanic and arid terrain search; dryness does not establish basalt."},
    {"id":"botswana","name":"Botswana dry basins","bounds":[24.5,-22,27.5,-19],"rationale":"Interior Kalahari and Makgadikgadi vicinity; not all cells are dry lake deposits."},
    {"id":"chile","name":"Northern Chile / Altiplano","bounds":[-70,-25,-67,-22],"rationale":"Northern Chile arid plateau gradient, with geology explicitly screened separately."},
    {"id":"gobi","name":"Gobi region","bounds":[101,42,104,45],"rationale":"Gobi desert terrain and seasonal temperature contrast; no assumed mineral equivalence."},
]
SOURCES=[
    {"id":"power","title":"NASA POWER climatology API","url":"https://power.larc.nasa.gov/docs/services/api/temporal/climatology/","organization":"NASA LaRC"},
    {"id":"srtm","title":"SRTM dataset / OpenTopoData","url":"https://www.opentopodata.org/datasets/srtm/","organization":"NASA / OpenTopoData"},
    {"id":"mola","title":"MOLA MEGDR topography","url":"https://pds-geosciences.wustl.edu/missions/mgs/megdr.html","organization":"NASA PDS"},
    {"id":"lola","title":"LOLA gridded data products","url":"https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Lunar%20Reconnaissance%20Orbiter%20(LRO)/LOLA/GDR/GDRDEM.htm","organization":"NASA PDS"},
    {"id":"gibs","title":"NASA GIBS imagery access","url":"https://nasa-gibs.github.io/gibs-api-docs/access-basics/","organization":"NASA EOSDIS"},
    {"id":"macrostrat","title":"Macrostrat data services","url":"https://dev.macrostrat.org/docs/data-services","organization":"Macrostrat / UW–Madison"},
    {"id":"salda","title":"Jez Like Mars: Jezero and Lake Salda","url":"https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/","organization":"NASA Earth Observatory"},
    {"id":"lunar-volcanism","title":"Lunar volcanism","url":"https://science.nasa.gov/moon/lunar-volcanism/","organization":"NASA Science"},
    {"id":"crisium","title":"Wrinkle ridge in Mare Crisium","url":"https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/","organization":"NASA Science"},
    {"id":"challenge","title":"2026 Space Apps challenge","url":"https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/","organization":"NASA Space Apps"},
]


def criteria_for(candidate, mission):
    climate=candidate["climate"]
    terrain=candidate["terrain"]
    geo=classify_geology(candidate["geology"],mission)
    explicit=candidate.get("reference_assessments",{}).get(mission)
    if explicit:
        geo=explicit
    annual=climate.get("annual_precip_mm")
    precip=climate.get("PRECTOTCORR",{})
    temp=climate.get("T2M",{})
    tr=terrain.get("metrics",{})
    terrain_value=None
    if tr:
        # Broad fieldwork challenge preference; not rover safety or exact mechanics.
        ideal=3 if mission=="jezero" else 5
        terrain_value=math.exp(-.5*((tr["p90_slope_deg"]-ideal)/5)**2)
    refs=[s["source_url"] for s in terrain.get("provenance",[]) ]
    t=temp.get("value")
    return {"geology":geo,
        "terrain":{"value":terrain_value,"rationale":"Bell-shaped preference for broad fieldwork challenge: p90 slope ideal 3° (Mars) or 5° (Moon), width 5°. Coarse screening cannot certify traversability.","source_refs":refs,"classification":"ASSUMED"},
        "aridity":{"value":None if annual is None else max(0,min(1,1-annual/400)),"rationale":"Terrestrial dry-operating proxy clamp(1-annual_mm/400); not planetary precipitation equivalence.","source_refs":[precip["provenance"]["source_url"]] if precip else [],"classification":"ASSUMED"},
        "temperature":{"value":None if t is None else max(0,1-abs(t-10)/40),"rationale":"Earth field-operation logistics heuristic: preference around 10°C annual air temperature, 40°C scale. Does not compare planetary surface temperatures or diurnal cycles.","source_refs":[temp["provenance"]["source_url"]] if temp else [],"classification":"ASSUMED"}}


def reality_gap(candidate,mission,assessment):
    body="Mars" if mission=="jezero" else "Moon"
    match=[]
    if candidate["terrain"].get("metrics"):
        match.append("Real SRTM measurements support regional slope, relief and detrended terrain analysis across 24×24 km.")
    if candidate["climate"].get("annual_precip_mm") is not None:
        match.append("NASA POWER climatology describes terrestrial precipitation and field-operating context.")
    if assessment["utility"]["criteria"]["geology"]["value"] is not None:
        match.append(assessment["utility"]["criteria"]["geology"]["rationale"])
    missing=["Field-scale mineralogy, grain-size distribution, bearing strength, permits, access, logistics and local hazards have not been assessed.","Coarse DEM samples cannot detect boulders, caves, rover-scale obstacles or landing hazards."]
    if assessment["utility"]["criteria"]["geology"]["value"] is None:
        missing.insert(0,"Geology requires verification; no supported matching material/process score.")
    if assessment["fidelity"]["value"] is None:
        missing.append("Physical terrain fidelity is not assessed: insufficient compatible terrain data.")
    return {"match":match,"mission_use":"Rehearse sedimentary sampling, documentation and geological navigation workflows." if mission=="jezero" else "Rehearse basalt sampling, route planning and volcanic-field surface operations.","mismatch":[f"Earth gravity (~9.81 m/s²) differs from {body} (~3.71 m/s²)." if mission=="jezero" else "Earth gravity (~9.81 m/s²) differs from lunar gravity (~1.62 m/s²).","Earth's dense, nitrogen/oxygen-rich atmosphere does not reproduce the thin CO₂-dominated Martian atmosphere." if mission=="jezero" else "Earth's atmosphere does not reproduce lunar vacuum or its thermal cycling.","Earth does not reproduce the planetary radiation environment.","Biology, water, weathering, soil cohesion and regolith mechanics can differ fundamentally.","Earth air-temperature climatology is not planetary surface temperature."]+candidate.get("limits",[]),"missing":missing,"force_model":"F_parallel = m·g·sin(θ); N = m·g·cos(θ). Simple gravitational components only: no wheel traction, slip, sinkage or cohesion model.","conclusion":"An Earth test can validate navigation and science workflows without reproducing planetary vehicle mechanics."}


def experiment(candidate,mission,assessment):
    geology=assessment["utility"]["criteria"]["geology"]["value"]
    return {"hypothesis":"If mapped sedimentary/material evidence is confirmed at a permitted subsite, a standardized sampling transect can rehearse evidence-preserving geological fieldwork." if mission=="jezero" else "If basaltic material and a permitted subsite are confirmed, repeated mapped traverses can evaluate navigation and sample-documentation workflows.","objective":"Sedimentary sampling and preservation-context documentation" if mission=="jezero" else "Basalt sampling and volcanic-terrain route documentation","why_useful":assessment["utility"]["criteria"]["geology"]["rationale"],"equipment":["GNSS or surveyed control points","Georeferenced field camera","Portable mineralogy (Raman/XRD where available)","Surveyed slope/terrain measurement and sample log"],"measurements":["Record lithology and mineralogy at each station","Measure local slope, grain size and bearing strength","Log route length, localization error and sample metadata completeness"],"success_indicator":"Proposed protocol target (not an observed result): ≥90% of sample stations with complete coordinates, photographs and lithology logs; report actual localization error without claiming a mission threshold.","next_measurement":"Confirm local lithology by field mapping and portable mineralogy before selecting test routes.","unvalidated":"No field campaign or experimental result has been performed. Site access, safety, legal permits and geological representativeness remain unvalidated.","cannot_reproduce":reality_gap(candidate,mission,assessment)["mismatch"],"evidence_gate":"Preliminary test hypothesis" if geology is not None and assessment["utility"]["coverage"]>=.7 else "Verification-first proposal; insufficient geological evidence", "classification":"ASSUMED"}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--offline",action="store_true")
    parser.add_argument("--per-region",type=int,default=4)
    args=parser.parse_args()
    client=CachedHTTP(offline=args.offline)
    out=ROOT/"data"/"derived"
    all_cells=[];errors=[]
    for region in REGIONS:
        try:
            cells=parse_regional(fetch_regional(client,region),region["id"])
            all_cells+=cells
            print(f"{region['id']}: {len(cells)} actual cells",flush=True)
        except Exception as exc:
            errors.append({"stage":"regional","region":region["id"],"reason":str(exc)})
    land_path=ROOT/"data/source/ne_110m_land.geojson"
    if not land_path.exists():
        raise RuntimeError("Run scripts/fetch_geography.py to acquire the documented broad land mask before screening.")
    land=json.loads(land_path.read_text(encoding="utf-8"))
    for cell in all_cells:
        cell["land_eligible"]=on_land(cell["longitude"],cell["latitude"],land)
        cell["land_mask_note"]="Natural Earth 110m broad land screen; coastal classification is approximate and not field validation. All cells retained, water/coast-screened centers excluded from shortlist."
    atomic_json(out/"screened_cells.geojson",{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[c["longitude"],c["latitude"]]},"properties":c} for c in all_cells]})
    shortlist=select_candidates(all_cells,per_region=args.per_region)
    selected=[]
    for i,cell in enumerate(shortlist):
        selected.append({**cell,"name":f"{next(r['name'] for r in REGIONS if r['id']==cell['region_id'])} · {sum(c['region_id']==cell['region_id'] for c in shortlist[:i])+1:02}","benchmark":False,"discovery_method":"NASA regional precipitation, deterministic aridity ranking, 65 km separation; geological relevance not assumed."})
    ref_path=out/"reference_evidence.json"
    references=json.loads(ref_path.read_text(encoding="utf-8")) if ref_path.exists() else []
    if isinstance(references,dict):
        references=references.get("benchmarks",references.get("references",[]))
    for reference in references:
        reference["benchmark"]=True
        reference["region_id"]="benchmark"
        reference["source_refs"]=[r["url"] for r in reference.get("references",[])]
        reference["reference_assessments"]={mission:{"value":None,"rationale":"This benchmark's published subsite evidence does not establish this mission's required geological material/process. Regional map polygons do not override subsite evidence.","source_refs":[],"classification":"UNAVAILABLE"} for mission in ("jezero","mare-crisium")}
        if reference["id"] in {"reference-salda","reference-atacama"}:
            reference["reference_assessments"]["jezero"]={"value":1. if reference["id"]=="reference-salda" else .5,"rationale":reference["material_process"]+". "+reference["mars_relevance"],"source_refs":reference["source_refs"],"classification":"LITERATURE-SUPPORTED"}
        if reference["id"] in {"reference-khaybar","reference-craters"}:
            reference["reference_assessments"]["mare-crisium"]={"value":1.,"rationale":reference["material_process"]+". "+reference["moon_relevance"],"source_refs":reference["source_refs"],"classification":"LITERATURE-SUPPORTED"}
    selected.extend(references)
    target_path=out/"planetary_targets.json"
    targets=json.loads(target_path.read_text(encoding="utf-8")) if target_path.exists() else [{"id":"jezero","body":"Mars","name":"Jezero Crater","latitude":18.45,"longitude":77.45,"terrain":{"status":"unavailable"}},{"id":"mare-crisium","body":"Moon","name":"Mare Crisium","latitude":16.18,"longitude":59.1,"terrain":{"status":"unavailable"}}]
    if isinstance(targets,dict):targets=targets.get("targets",[])
    for target in targets:
        profile=target.get("terrain",{})
        for source in profile.get("provenance",[]):
            source.setdefault("source_url",source.get("url"))
            source.setdefault("dataset","NASA MOLA MEGDR16" if target["id"]=="jezero" else "NASA LOLA LDEM16")
            source.setdefault("original_unit","m")
            source.setdefault("classification","MEASURED")
        if profile.get("status")=="available":
            try:
                profile["metrics"]=terrain_metrics(profile["elevations_m"],profile["sample_spacing_m"])
            except ValueError as exc:
                profile.update(status="unavailable",reason=str(exc))
    candidates=[]
    for candidate in selected:
        candidate.setdefault("benchmark",True)
        candidate.setdefault("region_id","benchmark")
        lat,lon=candidate["latitude"],candidate["longitude"]
        print(f"Characterizing {candidate['name']} ({lat},{lon})",flush=True)
        try:
            candidate["climate"]=parse_point(fetch_point(client,lat,lon),lat,lon)
        except Exception as exc:
            candidate["climate"]={};errors.append({"stage":"point","candidate":candidate["id"],"reason":str(exc)})
        try:
            candidate["terrain"]=sample_grid(client,lat,lon)
            candidate["terrain"]["metrics"]=terrain_metrics(candidate["terrain"]["elevations_m"],4000)
        except Exception as exc:
            candidate["terrain"]={"status":"unavailable","reason":str(exc),"provenance":[]};errors.append({"stage":"srtm","candidate":candidate["id"],"reason":str(exc)})
        try:
            candidate["geology"]=fetch_geology(client,lat,lon)
        except Exception as exc:
            candidate["geology"]={"status":"unavailable","units":[],"source_refs":[],"reason":str(exc)};errors.append({"stage":"geology","candidate":candidate["id"],"reason":str(exc)})
        candidate["assessments"]={}
        for target in targets:
            mission=target["id"]
            utility=mission_utility(criteria_for(candidate,mission),mission,benchmark=candidate["benchmark"])
            fidelity=physical_fidelity(candidate["terrain"],target.get("terrain"))
            alpha=.30 if mission=="jezero" else .55
            assessment={"utility":utility,"fidelity":fidelity,"priority":combined_priority(fidelity["value"],utility,alpha),"alpha":alpha,"gamma":1}
            assessment["reality_gap"]=reality_gap(candidate,mission,assessment)
            assessment["experiment"]=experiment(candidate,mission,assessment)
            candidate["assessments"][mission]=assessment
        statuses=[a["utility"]["status"] for a in candidate["assessments"].values()]
        candidate["status"]="REFERENCE ANALOG" if candidate["benchmark"] else "CHARACTERIZED CANDIDATE" if "CHARACTERIZED CANDIDATE" in statuses else "SCREENED CANDIDATE"
        candidate["source_refs"]=sorted(set(candidate.get("source_refs",[])+[v["provenance"]["source_url"] for v in candidate["climate"].values() if isinstance(v,dict) and "provenance" in v]+[s["source_url"] for s in candidate["terrain"].get("provenance",[])]))
        candidates.append(candidate)
        atomic_json(out/"candidates.json",candidates)
    now=datetime.now(timezone.utc).isoformat()
    summary={"screened_cells":len(all_cells),"valid_screened_cells":sum(c["quality"]=="valid" for c in all_cells),"shortlisted_candidates":discovery_count(candidates),"characterized_candidates":sum(c["status"]=="CHARACTERIZED CANDIDATE" for c in candidates),"benchmark_sites":sum(c["benchmark"] for c in candidates),"climate_profiles":sum(bool(c["climate"]) for c in candidates),"terrain_profiles":sum(c["terrain"].get("status")=="available" for c in candidates),"planetary_profiles":sum(t.get("terrain",{}).get("status")=="available" for t in targets),"geology_mapped":sum(c["geology"].get("status")=="mapped" for c in candidates),"errors":errors}
    dataset={"schema_version":"1.0","generated_at":now,"regions":REGIONS,"candidates":candidates,"targets":targets,"sources":SOURCES,"summary":summary,"config":{"aridity_threshold_mm":400,"separation_km":65,"per_region":args.per_region,"sample_spacing_m":4000,"footprint_m":24000,"gibs":{"layer":"MODIS_Terra_CorrectedReflectance_TrueColor","date":"2025-06-01","matrix":"GoogleMapsCompatible_Level9","maxzoom":9},"ranking":"Earth experiment suitability U, evidence coverage C used as secondary sort. Benchmarks separate. Combined priority shown only when eligible; no discovery winner claim."}}
    Dataset.model_validate(dataset)
    atomic_json(out/"dataset.json",dataset)
    atomic_json(out/"observations.json",[{"candidate_id":c["id"],"observations":{k:v for k,v in c["climate"].items() if isinstance(v,dict)}} for c in candidates])
    atomic_json(out/"provenance.json",{"generated_at":now,"sources":SOURCES,"files":[{"path":str(p.relative_to(ROOT)),"url":r["url"],"retrieved_at":r["retrieved_at"],"sha256":r["sha256"]} for p in sorted((ROOT/"data"/"cached").glob("*.json")) for r in [json.loads(p.read_text(encoding="utf-8"))]]})
    public=ROOT/"frontend"/"public"/"data"
    for filename in ("dataset.json","screened_cells.geojson","provenance.json"):
        atomic_json(public/filename,json.loads((out/filename).read_text(encoding="utf-8")))
    atomic_json(out/"summary.json",summary)
    print(json.dumps(summary,indent=2),flush=True)


if __name__=="__main__":main()
