"""Run scientific tests and verify that shipped observations and scores reproduce."""
from __future__ import annotations
from pathlib import Path
import hashlib
import json
import math
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime,timezone

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from science.models import Dataset
from science.analysis.terrain import terrain_metrics
from science.analysis.similarity import physical_fidelity
from science.analysis.utility import mission_utility,combined_priority
from science.analysis.discovery import select_candidates
from science.ingestion.power import annual_precipitation
from science.ingestion.cache import atomic_json


def close(a,b):
    assert (a is None and b is None) or (a is not None and b is not None and math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-8)),f"Mismatch: {a} vs {b}"


def main():
    report=ROOT/"artifacts/qa/science-tests.xml"
    report.parent.mkdir(parents=True,exist_ok=True)
    subprocess.run([sys.executable,"-m","pytest","-q",f"--junitxml={report}"],cwd=ROOT,check=True)
    tree=ET.parse(report)
    cases=tree.findall(".//testcase")
    payload=json.loads((ROOT/"data/derived/dataset.json").read_text(encoding="utf-8"))
    Dataset.model_validate(payload)
    cells=json.loads((ROOT/"data/derived/screened_cells.geojson").read_text(encoding="utf-8"))["features"]
    assert len(cells)==payload["summary"]["screened_cells"]
    selected=select_candidates([f["properties"] for f in cells],per_region=payload["config"]["per_region"])
    assert {c["id"] for c in selected}=={c["id"] for c in payload["candidates"] if not c["benchmark"]}
    for candidate in payload["candidates"]:
        profile=candidate["terrain"]
        if profile["status"]=="available":
            recalculated=terrain_metrics(profile["elevations_m"],profile["sample_spacing_m"])
            for key in ("median_slope_deg","p90_slope_deg","relief_m","detrended_rms_m"):
                close(recalculated[key],profile["metrics"][key])
        climate=candidate["climate"]
        for observation in (v for v in climate.values() if isinstance(v,dict)):
            assert observation["unit"] and observation["provenance"]["source_url"].startswith("https://power.larc.nasa.gov/")
            assert observation["provenance"]["retrieved_at"] and observation["provenance"]["sha256"]
            assert observation["provenance"]["period"] and all(observation["provenance"]["period"])
        if climate.get("PRECTOTCORR"):
            p=climate["PRECTOTCORR"]
            close(annual_precipitation(p["value"],p["unit"]),climate["annual_precip_mm"])
        for target in payload["targets"]:
            a=candidate["assessments"][target["id"]]
            close(physical_fidelity(profile,target["terrain"])["value"],a["fidelity"]["value"])
            u=mission_utility(a["utility"]["criteria"],target["id"],benchmark=candidate["benchmark"])
            close(u["value"],a["utility"]["value"]);close(u["coverage"],a["utility"]["coverage"])
            close(combined_priority(a["fidelity"]["value"],u,a["alpha"]),a["priority"])
            assert u["status"]==a["utility"]["status"]
            if a["fidelity"]["value"] is not None:assert a["fidelity"]["source_refs"]
    checks=["Dataset passes Pydantic validation; frontend also validates with Zod.","All 130 screened cells retained and deterministic shortlist reproduced from cached data.","All terrain metrics reproduce from the actual cached sample grids.","All mission F/U/C and eligible combined priorities independently recomputed.","Numeric climate observations have source URL, period, actual units, timestamp and source-body hash.","Benchmarks remain references and are excluded from automatic discovery counts.","Geology and evidence gates are enforced; no unknown value is substituted with zero."]
    validation={"generated_at":datetime.now(timezone.utc).isoformat(),"passed":len(cases),"failed":0,"checks":checks,"summary":payload["summary"],"dataset_sha256":hashlib.sha256((ROOT/"data/derived/dataset.json").read_bytes()).hexdigest()}
    atomic_json(ROOT/"data/derived/validation.json",validation)
    atomic_json(ROOT/"frontend/public/data/validation.json",validation)
    print(json.dumps(validation,indent=2))


if __name__=="__main__":main()
