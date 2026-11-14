"""Reproduce geographic scope of curated primary literature; never change scores."""
import hashlib,json,math,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from science.analysis.discovery import distance_km

def dms(parts):
    degrees,minutes,seconds,hemisphere=parts
    if hemisphere not in ('N','S','E','W') or not 0<=minutes<60 or not 0<=seconds<60:raise ValueError('Invalid reported coordinate')
    return (degrees+minutes/60+seconds/3600)*(-1 if hemisphere in ('S','W') else 1)

def build():
    source=ROOT/'data/source/site_evidence.json';raw=source.read_bytes();document=json.loads(raw)
    field=json.loads((ROOT/'data/derived/field_candidates.json').read_text())
    candidates={c['id']:c for c in field['candidates']}
    for case in document['cases']:
        c=candidates[case['candidate_id']];case['candidate_center']={'latitude':c['latitude'],'longitude':c['longitude']}
        sources={s['id']:s for s in case['sources']}
        for point in case['reported_points']:
            lat=point.get('latitude',dms(point['latitude_dms']) if 'latitude_dms' in point else None)
            lon=point.get('longitude',dms(point['longitude_dms']) if 'longitude_dms' in point else None)
            if lat is None or lon is None or not -90<=lat<=90 or not -180<=lon<=180:raise ValueError('Invalid literature position')
            point.update(latitude=lat,longitude=lon)
            east=math.radians(lon-c['longitude'])*6371000*math.cos(math.radians(c['latitude']));north=math.radians(lat-c['latitude'])*6371000
            point['derived_scope']={'distance_from_center_km':distance_km(c,{'latitude':lat,'longitude':lon}),'east_m':east,'north_m':north,'within_approximate_analysis_window':abs(east)<=12000 and abs(north)<=12000,'classification':'DERIVED','method':'Spherical haversine distance; local equirectangular offsets with Earth6371000m, consistent with the SRTM sampling window; source datum uncertainty unassessed.'}
            point['source_url']=sources[point['source_id']]['url']
            point['classification']='LITERATURE-SUPPORTED / REPORTED POSITION'
    document['source_sha256']=hashlib.sha256(raw).hexdigest();document['score_policy']='No original or expanded screening scores changed. These are scoped literature interpretations and proposed experiments, not new NASA measurements.'
    body=json.dumps(document,indent=2,allow_nan=False)+'\n'
    for directory in [ROOT/'data/derived',ROOT/'frontend/public/data']:(directory/'site_evidence.json').write_text(body,encoding='utf-8')
    return document
if __name__=='__main__':
    for case in build()['cases']:
        print(case['candidate_id'],[(p['id'],round(p['derived_scope']['distance_from_center_km'],3),p['derived_scope']['within_approximate_analysis_window']) for p in case['reported_points']])
