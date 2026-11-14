"""Cross-check the shipped pilot, with no external calls or synthetic production rasters."""
import json
from pathlib import Path
import pytest
from science.analysis.terrain import terrain_metrics
from science.analysis.support import supported_fidelity
ROOT=Path(__file__).resolve().parents[2]

def test_shipped_pilot_features_and_scores_reproduce_without_changing_original_data():
    pilot=json.loads((ROOT/'data/derived/terrain_pilot.json').read_text(encoding='utf-8'))
    data=json.loads((ROOT/'data/derived/dataset.json').read_text(encoding='utf-8'))
    assert len(pilot['results'])==4
    for result in pilot['results']:
        candidate=next(c for c in data['candidates'] if c['id']==result['candidate_id'])
        assert result['original_srtm_fidelity']==candidate['assessments'][result['mission']]['fidelity']['value']
        assert all(s['sha256'] and s['url'].startswith('https://') for s in result['earth_sources'])
        for scenario in result['scenarios']:
            for body in ('earth','planet'):
                profile=scenario[body]
                measured=terrain_metrics(profile['elevations_m'],4000)
                for key in ('median_slope_deg','p90_slope_deg','relief_m','detrended_rms_m'):
                    assert measured[key]==pytest.approx(profile['metrics'][key],abs=1e-9)
            assert supported_fidelity(scenario['earth'],scenario['planet'],result['planet_native_resolution_m'])['value']==pytest.approx(scenario['fidelity']['value'])
            if scenario.get('quadrature_check'):
                assert scenario['quadrature_check']['absolute_score_delta']<.01
