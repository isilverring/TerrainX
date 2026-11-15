import hashlib,json
from pathlib import Path
import numpy as np
from science.analysis.illumination import horizon_at
ROOT=Path(__file__).resolve().parents[2]

def test_lunar_geometry_has_full_declared_support_and_provenance():
    p=json.loads((ROOT/'data/derived/lunar_illumination.json').read_text(encoding='utf-8'))
    assert len(p['sites'])==8 and len(p['times_utc'])==8760
    assert len(p['kernels'])==5 and all(len(k['sha256'])==64 for k in p['kernels'])
    assert len(p['crosschecks'])==4 and all(c['difference_deg']<.02 and c['azimuth_difference_deg']<.02 for c in p['crosschecks'])
    assert p['frame']=='MOON_ME (DE440_ME421 alignment)'
    for site in p['sites']:
        el=np.asarray(site['hourly']['sun_elevation_deg']);az=np.asarray(site['hourly']['sun_azimuth_deg']);lit=np.asarray(site['hourly']['visible'])
        assert el.shape==az.shape==lit.shape==(8760,)
        h=horizon_at(az,site['horizon']['elevation_deg'])
        assert not np.any(lit & (el<h-2e-5))
        assert not np.any(~lit & (el>h+2e-5))
        assert site['summary']['visible_fraction']==float(lit.mean())
        assert sum(m['samples'] for m in site['monthly'])==8760
        assert site['footprint_m']==24000 and site['terrain_spacing_m']==4000

def test_operations_grids_are_source_scoped_and_have_honest_missing_values():
    p=json.loads((ROOT/'data/derived/operations_terrain.json').read_text(encoding='utf-8'))
    manifest=json.loads((ROOT/'data/source/pilot/manifest.expanded.json').read_text(encoding='utf-8'))
    assets={a['url']:a for a in manifest['assets']}
    assert len(p['profiles'])==18
    assert len({g['id'] for g in p['profiles']})==18
    for profile in p['profiles']:
        assert profile['shape']==[97,97] and profile['sample_spacing_m']==250
        assert profile['slope_baseline_m']==500
        values=[v for row in profile['elevations_m'] for v in row]
        assert len(values)==9409
        assert sum(v is not None for v in values)==profile['valid_land_samples']
        assert profile['valid_land_samples']+profile['water_excluded_samples']+profile['void_samples']==9409
        assert set(a['kind'] for a in profile['sources'])=={'DEM','EDM','FLM','WBM'}
        assert all(a['sha256']==assets[a['url']]['sha256'] for a in profile['sources'])

def test_expansion_does_not_rewrite_original_scientific_observations():
    raw=(ROOT/'frontend/public/data/dataset.json').read_bytes().replace(b'\r\n',b'\n')
    assert hashlib.sha256(raw).hexdigest()=='3515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c'
