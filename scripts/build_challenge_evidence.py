"""Normalize curated primary-source extracts without upgrading candidate evidence."""
from __future__ import annotations
import hashlib,json,sys
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from science.ingestion.cache import stable_science_json,atomic_json


def clean(value):
    if isinstance(value,dict):return {k:clean(v) for k,v in value.items()}
    if isinstance(value,list):return [clean(v) for v in value]
    if isinstance(value,str):
        # Repair extraction encoding artifacts; preserve source files/receipts verbatim.
        for before,after in [('آ°','°'),('آ·','·'),('â€“','–'),('â€”','—'),('â€²','′'),('â€³','″'),('â‰¥','≥'),('آ±','±'),('أ—','×')]:value=value.replace(before,after)
    return value


def main():
    folder=ROOT/'data/source/challenge_evidence'
    geo=json.loads((folder/'geobio-extracts.json').read_text(encoding='utf-8'))
    other=json.loads((folder/'caves-resources-extracts.json').read_text(encoding='utf-8'))
    sources={s['id']:s for s in geo['sources']};records=[]
    for r in geo['records']:
        source=sources[r['source_id']];proof=source.get('cached_primary')
        records.append({'id':r['id'],'title':r['title'],'categories':r['dimensions'],'body':'Earth',
                        'candidate_id':r['candidate_id'],'classification':'LITERATURE-SUPPORTED',
                        'latitude':r['geography'].get('latitude'),'longitude':r['geography'].get('longitude'),
                        'coordinate_scope':r['geography']['scope'],'period':r['period'],
                        'summary':' '.join((m['name']+': '+m['evidence']) if isinstance(m,dict) else str(m) for m in r['materials_and_biology']),
                        'observations':[{'label':o['label'],'value':o.get('value'),'unit':o.get('unit',''),
                                         'method':o['method'],'qualifier':o.get('qualifier','reported'),'scope':o.get('sample_scope','')} for o in r['observations']],
                        'references':[{'title':source['title'],'url':source['url'],'locator':r['source_locator'],
                                       'sha256':proof['sha256'] if proof else None,
                                       'proof': 'Downloaded primary response hash' if proof else 'Curated publisher table extract; no full publisher-response hash'}],
                        'limitations':r['limitations'],'next_measurement':r['next_measurement'],'proposed_experiment':None})
    for r in other['records']:
        position=r.get('coordinates') or {};is_cave='CAVE' in r['category']
        observations=[]
        for o in r['measurements']:
            value=o.get('converted_value',o['value']);unit=o.get('converted_unit',o['unit'])
            label=o['variable'].replace('_',' ')
            if o.get('depth_m') is not None:label+=f" at{o['depth_m']}m depth"
            observations.append({'label':label,'value':value,'unit':unit,'method':o['method'],
                                 'qualifier':o.get('comparison',o['classification']), 'scope':o['spatial_scope'],
                                 'uncertainty':o.get('uncertainty'),'original_value':o['value'],'original_unit':o['unit']})
        experiment=r.get('experiment')
        records.append({'id':r['id'],'title':r['name'],'categories':['caves','subsurface'] if is_cave else ['resources','permafrost'] if 'PERMAFROST' in r['category'] else ['resources','water_ice'],
                        'body':r['body'],'candidate_id':r['associated_candidate_id'],'classification':r['category'],
                        'latitude':position.get('latitude'),'longitude':position.get('longitude'),
                        'coordinate_scope':position.get('scope',r.get('coordinate_scope','Location not numerically verified')),
                        'entrance_coordinates':r.get('entrance_coordinates'),
                        'period':'; '.join(str(m.get('period')) for m in r['measurements'] if m.get('period')) or 'Observation/survey date unavailable',
                        'summary':r['verified_feature'],'observations':observations,
                        'references':[{'title':s['title'],'url':s['url'],'locator':s.get('locator',''),
                                       'sha256':s.get('sha256') or s.get('response_sha256'),
                                       'proof':s.get('proof_scope','Primary-source extract/receipt; see source registry')} for s in r['sources']],
                        'limitations':r['limitations'],'next_measurement':experiment['next_measurement'] if experiment else '',
                        'proposed_experiment':experiment})
    if len({r['id'] for r in records})!=len(records):raise ValueError('Duplicate reference record')
    payload=clean({'contract':'terrainx-challenge-evidence-v1','generated_at':datetime.now(timezone.utc).isoformat(),
                   'classification':'SOURCE-SCOPED LITERATURE / AGENCY REFERENCE EVIDENCE','records':records,
                   'input_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in folder.glob('*extracts.json')},
                   'limitations':['Independent reference measurements are not new discoveries or cell-wide observations; candidate F/U/C are unchanged.',
                    'Named cave existence may be documented while exact entrance coordinates/survey epoch remain unknown. Recreation-site points are not surveyed entrances.',
                    'Historical permafrost temperature is not ice mass fraction. LCROSS abundance is local ejecta retrieval, not a lunar reserve or a measurement at another feature.',
                    'Microscopy/staining, incubation-derived counts, mineral phases and particle-size fractions are different observables. Read each method and spatial scope.']})
    payload=stable_science_json(ROOT/'data/derived/challenge_evidence.json',payload)
    atomic_json(ROOT/'frontend/public/data/challenge_evidence.json',payload)
    print(len(records),'source-scoped reference records')

if __name__=='__main__':main()
