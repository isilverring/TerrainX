"""Synthetic numerical fixtures are tests only, never application observations."""
import copy
import json
from pathlib import Path

import numpy as np
import pytest

from science.ingestion.power import clean,annual_precipitation,parse_point,parse_regional
from science.ingestion.power import acquisition_period
from science.ingestion.srtm import grid_coordinates,batches,sample_grid
from science.analysis.terrain import terrain_metrics
from science.analysis.similarity import feature_similarity,physical_fidelity,scales_compatible
from science.analysis.utility import mission_utility,combined_priority,validate_weights,WEIGHTS
from science.analysis.discovery import select_candidates,discovery_count
from science.analysis.discovery import on_land
from science.ingestion.mola import read_product_metadata,point_from_offset

def flat():return np.zeros((7,7))
def profile():
    return {"status":"available","sample_spacing_m":4000,"footprint_m":24000,"native_resolution_m":{"x":90,"y":90},"provenance":[{"source_url":"https://example.test/fixture"}],"metrics":terrain_metrics(flat(),4000)}
def criterion(v):return {"value":v,"source_refs":["https://example.test/fixture"]}
def criteria(g=None,t=.8,a=.9,temp=.6):return {"geology":criterion(g),"terrain":criterion(t),"aridity":criterion(a),"temperature":criterion(temp)}

def test_precip_conversion():assert annual_precipitation(1,"mm/day")==pytest.approx(365.25)
def test_precip_invalid_units():
    with pytest.raises(ValueError):annual_precipitation(1,"mm/month")
@pytest.mark.parametrize("v",[-999,None,float("nan"),float("inf"),"missing",True])
def test_missing(v):assert clean(v) is None
def test_negative_precip_missing():assert annual_precipitation(-1,"mm/day") is None
def test_point_period_header_range():
    assert acquisition_period({"range":"25-year Meteorological and Solar Monthly & Annual Climatologies (January 2001 - December 2025)"})==["20010101","20251231"]
    assert acquisition_period({}) is None
def test_regional_live_fixture():
    raw=json.loads((Path(__file__).parents[2]/"data/source/research/power_regional.json").read_text(encoding="utf-8"))
    data=raw.get("data",raw)
    record={"data":data,"url":"https://power.larc.nasa.gov/fixture","retrieved_at":"2026-11-14","sha256":"fixture"}
    # Research downloads wrap raw payload in a body field on some acquisition paths.
    if "features" not in data and "body" in data:record["data"]=data["body"]
    cells=parse_regional(record,"saudi")
    assert len(cells)==25
    assert cells[0]["annual_precip_mm"]==pytest.approx(cells[0]["daily_precip_mm"]*365.25)
    assert cells[0]["provenance"]["original_unit"]=="mm/day"
def test_point_parser():
    record={"url":"https://power.larc.nasa.gov/test","retrieved_at":"today","sha256":"x","data":{"header":{"start":"2001","end":"2025","fill_value":-999},"parameters":{"T2M":{"units":"C"},"PRECTOTCORR":{"units":"mm/day"}},"properties":{"parameter":{"T2M":{"ANN":10,**{m:i for i,m in enumerate(("JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"))}},"PRECTOTCORR":{"ANN":-999}}}}}
    result=parse_point(record,1,2)
    assert result["seasonal_temperature_range_c"]==11
    assert result["annual_precip_mm"] is None
    assert result["T2M"]["provenance"]["latitude"]==1
def test_srtm_grid_order_spacing():
    grid=grid_coordinates(25,40)
    assert len(grid)==49 and grid[24]==(25,40)
    assert grid[0][0]<25 and grid[0][1]<40 and grid[-1][0]>25
    assert (grid[25][1]-40)*111195*np.cos(np.radians(25))==pytest.approx(4000,rel=1e-4)
def test_srtm_batch_limit():assert [len(x) for x in batches(list(range(249)))]==[100,100,49]
def test_srtm_reject_bad_batch():
    with pytest.raises(ValueError):batches([],101)
def test_srtm_rate_interval_and_coordinates():
    class Client:
        def get(self,url,params,interval):
            assert interval>=1 and len(params["locations"].split("|"))<=100
            points=[tuple(map(float,p.split(","))) for p in params["locations"].split("|")]
            return {"url":url,"retrieved_at":"today","sha256":"x","data":{"status":"OK","results":[{"location":{"lat":p[0],"lng":p[1]},"elevation":0} for p in points]}}
    assert sample_grid(Client(),25,40)["sample_spacing_m"]==4000
def test_flat_slope():assert terrain_metrics(flat(),4000)["median_slope_deg"]==0
def test_planar_slope():
    y,x=np.indices((7,7));z=.1*x*4000+.2*y*4000
    assert terrain_metrics(z,4000)["median_slope_deg"]==pytest.approx(np.degrees(np.arctan(np.hypot(.1,.2))))
def test_planar_roughness():
    y,x=np.indices((7,7));assert terrain_metrics(10*x+20*y+123,4000)["detrended_rms_m"]<1e-10
def test_nonplanar_roughness():
    z=flat();z[3,3]=100;assert terrain_metrics(z,4000)["detrended_rms_m"]>0
def test_relative_relief():
    z=np.arange(49).reshape((7,7));m=terrain_metrics(z,4000)
    assert m["relief_m"]==pytest.approx(np.quantile(z,.95)-np.quantile(z,.05))
    assert m["relative_relief"]==pytest.approx(m["relief_m"]/24000)
def test_invalid_samples():
    z=flat();z[:3]=np.nan
    with pytest.raises(ValueError):terrain_metrics(z,4000)
def test_similarity_identity():assert feature_similarity(4,4,3)==1
def test_similarity_declines():assert feature_similarity(4,5,3)>feature_similarity(4,9,3)
def test_cross_scale_rejected():
    a,b=profile(),profile();b["sample_spacing_m"]=250
    assert not scales_compatible(a,b) and physical_fidelity(a,b)["value"] is None
def test_coarse_native_rejected():
    a,b=profile(),profile();b["native_resolution_m"]={"x":10000,"y":10000}
    assert physical_fidelity(a,b)["value"] is None
@pytest.mark.parametrize("p",[None,{}, {"status":"unavailable"}])
def test_no_fictional_fidelity(p):assert physical_fidelity(profile(),p)["value"] is None
def test_full_fidelity_and_provenance():
    f=physical_fidelity(profile(),profile());assert f["value"]==100 and f["source_refs"]
def test_weights_normalized():
    for w in WEIGHTS.values():validate_weights(w)
    with pytest.raises(ValueError):validate_weights({"a":.7,"b":.4})
def test_geology_gate_and_coverage():
    u=mission_utility(criteria(),"jezero")
    assert u["coverage"]==pytest.approx(.45)
    assert u["status"]=="SCREENED CANDIDATE"
    assert u["value"] is not None # Report partial utility, with explicit inadequate evidence.
def test_characterization():assert mission_utility(criteria(1),"jezero")["status"]=="CHARACTERIZED CANDIDATE"
def test_documented_mismatch_not_characterized():assert mission_utility(criteria(0),"jezero")["status"]=="SCREENED CANDIDATE"
def test_null_not_zero():assert mission_utility(criteria(None,None,None,None),"jezero")["value"] is None
def test_mission_specific_ranking():
    # Different documented evidence for two missions changes order, not a universal Mars score.
    a=criteria(1);b=criteria(.5)
    assert mission_utility(a,"jezero")["value"]>mission_utility(b,"jezero")["value"]
    assert mission_utility(b,"mare-crisium")["value"]<mission_utility(a,"mare-crisium")["value"]
    a_moon=criteria(None);b_moon=criteria(1)
    assert mission_utility(a_moon,"mare-crisium")["value"]<mission_utility(b_moon,"mare-crisium")["value"]
def test_unknown_priority():assert combined_priority(None,mission_utility(criteria(1),"jezero"),.3) is None
def test_low_coverage_priority():assert combined_priority(80,mission_utility(criteria(),"jezero"),.3) is None
def test_benchmarks_not_discoveries():assert discovery_count([{"benchmark":True},{"benchmark":False}])==1
def test_deterministic_selection():
    cells=[{"id":str(i),"region_id":"r","latitude":20+i,"longitude":40,"aridity":.9} for i in range(5)]
    assert [x["id"] for x in select_candidates(cells)]==[x["id"] for x in select_candidates(list(reversed(cells)))]
def test_criterion_provenance_required():
    c=criteria(1);c["geology"]["source_refs"]=[]
    with pytest.raises(ValueError):mission_utility(c,"jezero")

def test_land_mask_excludes_water_and_holes():
    mask={"features":[{"geometry":{"type":"Polygon","coordinates":[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]}}]}
    assert on_land(.5,.5,mask)
    assert not on_land(1.5,1.5,mask)
    assert not on_land(8,8,mask)
def test_water_cells_excluded_from_shortlist():
    assert not select_candidates([{"region_id":"r","id":"water","aridity":1,"latitude":20,"longitude":40,"land_eligible":False}])
@pytest.mark.parametrize("prefix,encoding,scale",[("megt90n000eb","SignedMSB2",1),("ldem_16","SignedLSB2",.5)])
def test_real_planetary_labels(prefix,encoding,scale):
    directory=Path(__file__).parents[2]/"data/source/planetary"
    metadata=read_product_metadata(directory/f"{prefix}.xml",directory/f"{prefix}.lbl")
    assert metadata["encoding"]==encoding
    assert metadata["height_scale"]==scale
    assert metadata["lines"]==2880 and metadata["samples"]==5760
    assert metadata["vertical_unit"]=="m"
def test_cross_body_pixel_sizes_differ():
    targets=json.loads((Path(__file__).parents[2]/"data/derived/planetary_targets.json").read_text(encoding="utf-8"))
    assert targets[0]["terrain"]["native_resolution_m"]["y"]>targets[1]["terrain"]["native_resolution_m"]["y"]
def test_planetary_longitude_wrap():
    latitude,longitude=point_from_offset(0,359.99,12000,0,1737400)
    assert abs(latitude)<1e-9 and 0<=longitude<1
def test_reference_specific_evidence_not_overridden_by_regional_polygon():
    d=json.loads((Path(__file__).parents[2]/"data/derived/dataset.json").read_text(encoding="utf-8"))
    salda=next(c for c in d["candidates"] if c["id"]=="reference-salda")
    assert salda["assessments"]["jezero"]["utility"]["criteria"]["geology"]["value"]==1
    assert salda["assessments"]["mare-crisium"]["utility"]["criteria"]["geology"]["value"] is None
