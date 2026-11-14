"""New fields are unit-aware descriptors and model outputs, never invented analog claims."""
import hashlib,json
from pathlib import Path
import pytest
from science.analysis.environment import environmental_summary
from science.ingestion.diviner import validate_label,parse_record,summarize
ROOT=Path(__file__).resolve().parents[2]

def environment_record():
    rows=json.loads((ROOT/'data/derived/cell_search.json').read_text(encoding='utf-8'))['rows']
    url=rows[0]['environment']['source_url']
    return json.loads((ROOT/'data/cached'/f'{hashlib.sha256(url.encode()).hexdigest()}.json').read_text(encoding='utf-8'))

def test_environment_units_and_incomplete_months_are_not_guessed():
    r=environment_record();out=environmental_summary(r)
    assert out['units']['T2M_MIN']=='C' and out['units']['AOD_55']=='dimensionless'
    assert out['acquisition_period']==['20010101','20251231']
    r['data']['properties']['parameter']['T2M_MIN']['JAN']=-999
    assert environmental_summary(r)['annual_span_c'] is None
    r['data']['parameters']['T2M_MAX']['units']='K'
    with pytest.raises(ValueError):environmental_summary(r)

def test_public_cells_retain_units_and_provenance_and_land_gate():
    data=json.loads((ROOT/'frontend/public/data/cell_search.json').read_text(encoding='utf-8'))
    for row in data['rows']:
        assert row['environment']['units'] and row['environment']['sha256']
        assert row['biology']['retrieved_at']
        for obs in row['climate_observations'].values():
            assert obs['unit'] and obs['provenance']['sha256'] and obs['provenance']['period']
        if not row['land_eligible']:assert all(m['P'] is None for m in row['missions'].values())

def test_diviner_label_and_real_records_are_validated():
    bundle=json.loads((ROOT/'data/source/acquisition/terrainx-diviner-prp-south-sites.json').read_text(encoding='utf-8'))
    validate_label(bundle['label_xml'],bundle['label_sha256'])
    record=parse_record(bundle['records'][0].split('\t',2)[2])
    assert record['area_km2']>0
    with pytest.raises(ValueError):validate_label(bundle['label_xml']+' ',bundle['label_sha256'])
    with pytest.raises(ValueError):parse_record('')

def test_area_weighting_and_unknown_ice_do_not_become_detected_ice():
    rows=[{'area_km2':1,'temp_max':100,'temp_avg':80,'ice_depth':0,'ice_class':'surface_stable'},
          {'area_km2':3,'temp_max':120,'temp_avg':90,'ice_depth':-1,'ice_class':'unknown_code'}]
    out=summarize(rows)
    assert out['cold_trap_fraction']==.25
    assert out['ice_surface_stable_fraction']==.25
    assert out['ice_undocumented_code_fraction']==.75
    assert out['ice_stable_within_1m_fraction']==.25
    for r in rows:r['temp_max']=None
    assert summarize(rows)['cold_trap_fraction'] is None
    assert summarize(rows)['temp_max_k'] is None

def test_independent_diviner_verification_matches_the_published_checksum():
    proof=json.loads((ROOT/'data/source/diviner/verification.json').read_text(encoding='utf-8'))
    bundle=json.loads((ROOT/'data/source/acquisition/terrainx-diviner-prp-south-sites.json').read_text(encoding='utf-8'))
    assert proof['md5']==proof['published_md5']=='80cdfe83592a3419c74b1b55b636711e'
    assert proof['sha256']==bundle['sha256']
    assert proof['bytes']==604800210 and proof['records_scanned']==2880000
    assert proof['retained_records_verified']==len(bundle['records'])==30674
