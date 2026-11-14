import json,importlib.util
from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('site_evidence',ROOT/'scripts/build_site_evidence.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
def test_reported_positions_and_scope_are_reproducible():
 d=json.loads((ROOT/'data/derived/site_evidence.json').read_text());moon,mars=d['cases']
 assert module.dms([23,4,48,'S'])==pytest.approx(-23.08)
 assert module.dms([69,57,30,'W'])==pytest.approx(-69.9583333333)
 assert [p['derived_scope']['within_approximate_analysis_window'] for p in moon['reported_points']]==[True,True]
 assert moon['reported_points'][0]['derived_scope']['distance_from_center_km']==pytest.approx(9.865,abs=.001)
 p=mars['reported_points'][0];assert p['derived_scope']['distance_from_center_km']==pytest.approx(55.681,abs=.001);assert p['derived_scope']['within_approximate_analysis_window'] is False
 assert all(p['source_url'] and p['coordinate_datum'] for c in d['cases'] for p in c['reported_points'])
def test_case_evidence_does_not_claim_pure_basalt_or_local_mars_validation():
 d=json.loads((ROOT/'data/derived/site_evidence.json').read_text());moon,mars=d['cases']
 assert moon['reported_points'][0]['material']=='Basaltic-andesite lava'
 assert mars['subsite'] is None
 assert 'not verify' in mars['contradiction']
 assert 'No original or expanded screening scores changed' in d['score_policy']
