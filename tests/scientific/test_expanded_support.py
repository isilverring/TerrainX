"""Real expanded source outputs, independently recomputed from stored box means."""
import json, math
from pathlib import Path
import numpy as np
import pytest
from science.analysis.support import supported_fidelity
from science.analysis.terrain import terrain_metrics
ROOT=Path(__file__).resolve().parents[2]

def test_all_selected_sources_and_processing_results_are_traceable():
    d=json.loads((ROOT/'data/derived/terrain_support.json').read_text())
    assert len(d['source_manifest']['pilots'])==18
    assert len({a['tile_id'] for a in d['source_manifest']['assets'] if a['tile_id']})==33
    assert len(d['results'])==36
    assert sum(len(r['scenarios']) for r in d['results'])==360
    for r in d['results']:
        assert r['earth_sources'] and all(a['sha256'] and a['url'] for a in r['earth_sources'])
        for s in r['scenarios']:
            expected=supported_fidelity(s['earth'],s['planet'],r['planet_native_resolution_m'])
            assert expected['value']==pytest.approx(s['fidelity']['value'])
            for world in ['earth','planet']:
                p=s[world]
                m=terrain_metrics(p['elevations_m'],4000)
                for k in ['median_slope_deg','p90_slope_deg','relief_m','detrended_rms_m']:assert m[k]==pytest.approx(p['metrics'][k])

def test_western_point_baseline_and_sample_rank_bounds_are_valid():
    d=json.loads((ROOT/'data/derived/terrain_support.json').read_text())
    moon=next(r for r in d['results'] if r['candidate_id']=='chile--23.000--70.000' and r['mission']=='mare-crisium')
    assert moon['longitude']==-70
    assert math.isfinite(moon['partner_point_baseline']['value'])
    for r in d['sensitivity']:
        assert r['valid_scenarios']==10
        assert 1<=r['best_rank']<=r['median_rank']<=r['worst_rank']<=18
        assert 0<=r['F_min']<=r['F_max']<=100
