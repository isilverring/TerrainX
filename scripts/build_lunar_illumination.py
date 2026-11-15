"""Reproduce a bounded 2025 solar-geometry screen from JPL kernels and real LOLA grids.

Sun-centre visibility at feature centres is not illumination of NASA landing polygons,
a permanent-shadow inventory, solar power yield, or a landing/base certification.
"""
from __future__ import annotations
import hashlib,json,math,ssl,sys
from pathlib import Path
from datetime import datetime,timezone,timedelta
from concurrent.futures import ThreadPoolExecutor
import httpx
import numpy as np
import spiceypy as spice
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from science.analysis.illumination import sampled_horizon,sun_angles,light_summary
from science.ingestion.cache import stable_science_json,atomic_json

BASE='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/'
KERNELS=[
 ('lsk/naif0012.tls','678e32bdb5a744117a467cd9601cd6b373f0e9bc9bbde1371d5eee39600a039b',None),
 ('pck/pck00011.tpc','3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1',None),
 ('fk/satellites/moon_de440_250416.tf','a47c71e9c9f33796bdafb2c9d69a7ee447b6016ecad80f71cd6f3e479f9cf768',None),
 ('spk/planets/de440s.bsp',None,'3917ee56769db332790c751e2168843d'),
 ('pck/moon_pa_de440_200625.bpc',None,None),
]


def acquire():
    folder=ROOT/'data/source/illumination';folder.mkdir(parents=True,exist_ok=True)
    old=json.loads((folder/'kernels.json').read_text()) if (folder/'kernels.json').exists() else {'kernels':[]}
    prior={k['url']:k for k in old['kernels']}
    def get(item):
        relative,pin,md5=item;url=BASE+relative;p=folder/Path(relative).name
        if not p.exists():
            temporary=p.with_suffix(p.suffix+'.partial')
            with httpx.Client(timeout=120,follow_redirects=True,verify=ssl.create_default_context()) as client:
                with client.stream('GET',url) as response:
                    response.raise_for_status()
                    with temporary.open('wb') as stream:
                        for chunk in response.iter_bytes(1024*1024):stream.write(chunk)
            temporary.replace(p)
        body=p.read_bytes();sha=hashlib.sha256(body).hexdigest();digest=hashlib.md5(body).hexdigest()
        if (pin and sha!=pin) or (md5 and digest!=md5):raise ValueError('Published/pinned kernel checksum mismatch: '+p.name)
        if url in prior and sha!=prior[url]['sha256']:raise ValueError('Cached kernel changed: '+p.name)
        record={'file':p.name,'url':url,'bytes':len(body),'sha256':sha,'md5':digest,
                'retrieved_at':prior.get(url,{}).get('retrieved_at',datetime.now(timezone.utc).isoformat()),
                'published_md5':md5,'pinned_sha256':pin}
        print('Verified',p.name,len(body),flush=True);return record
    with ThreadPoolExecutor(max_workers=3) as pool:records=list(pool.map(get,KERNELS))
    atomic_json(folder/'kernels.json',{'kernels':records,'spiceypy_version':spice.__version__,
                'official_spk_checksum_url':BASE+'spk/planets/aa_checksums.txt',
                'frame_reference':BASE+'fk/satellites/aareadme.txt'})
    spice.kclear()
    for r in records:spice.furnsh(str(folder/r['file']))
    if spice.namfrm('MOON_ME')<=0:raise ValueError('High precision lunar ME frame unavailable')
    return records


def solar_geometry(et,latitude,longitude,altitude_m=0):
    point=spice.latrec(1737.4+altitude_m/1000,math.radians(longitude),math.radians(latitude))
    state,_=spice.spkcpo('SUN',float(et),'MOON_ME','OBSERVER','CN+S',point,'MOON','MOON_ME')
    return sun_angles(state[:3],latitude,longitude)


def crosscheck():
    source=ROOT/'data/source/illumination/horizons_checks.json'
    checks=json.loads(source.read_text(encoding='utf-8'));out=[]
    for check in checks['checks']:
        for observed in check['records']:
            epoch=spice.str2et(observed['epoch_utc']+' UTC')
            az,el=solar_geometry(epoch,check['latitude_north_deg'],check['longitude_east_deg'])
            difference=abs(el-observed['sun_center_elevation_degrees'])
            azdiff=abs((az-observed['azimuth_degrees_clockwise_from_north']+180)%360-180)
            if difference>.02 or azdiff>.02:raise ValueError('Horizons cross-check exceeds declared0.02degree tolerance')
            out.append({'site':check['site_name'],'epoch_utc':observed['epoch_utc'],'computed_elevation_deg':el,
                        'reference_elevation_deg':observed['sun_center_elevation_degrees'],'difference_deg':difference,
                        'azimuth_difference_deg':azdiff,'source_url':check['source_url'],'response_sha256':check['response_sha256']})
    return out


def main():
    records=acquire();checks=crosscheck()
    lunar_file=ROOT/'data/derived/lunar_polar.json';lunar=json.loads(lunar_file.read_text(encoding='utf-8'))
    # Match the actual retained LOLA profile to its label/ME reference radius.
    if lunar['raster']['sha256']!='a511e40d7a3ea3275945b4da2a1df377133264fab0be94b7434b1cf8907254cb':raise ValueError('Unreviewed LOLA source')
    start=datetime(2025,1,1,tzinfo=timezone.utc);times=[(start+timedelta(hours=i,minutes=30)).strftime('%Y-%m-%dT%H:%M:%SZ') for i in range(8760)]
    epochs=[spice.str2et(t) for t in times];sites=[]
    for site in lunar['sites']:
        if site['status']!='available':continue
        z=site['terrain']['elevations_m'];lat,lon=site['latitude'],site['longitude'];height=z[3][3]
        horizon=sampled_horizon(z,4000,lat,lon,observer_height_m=2)
        geometry=[solar_geometry(et,lat,lon,height+2) for et in epochs]
        az=np.array([p[0] for p in geometry]);el=np.array([p[1] for p in geometry])
        summary=light_summary(el,az,horizon['elevation_deg']);visibility=summary.pop('visibility')
        monthly=[]
        for month in range(1,13):
            indices=[i for i,t in enumerate(times) if int(t[5:7])==month]
            monthly.append({'month':month,'visible_fraction':sum(visibility[i] for i in indices)/len(indices),
                            'samples':len(indices),'sun_max_elevation_deg':float(max(el[indices]))})
        sites.append({'id':site['id'],'name':site['feature'],'latitude':lat,'longitude':lon,'centre_elevation_m':height,
                      'horizon':horizon,'summary':summary,'monthly':monthly,
                      'hourly':{'sun_elevation_deg':np.round(el,5).tolist(),'sun_azimuth_deg':np.round(az,5).tolist(),'visible':visibility},
                      'terrain_source_sha256':lunar['raster']['sha256'],'terrain_spacing_m':4000,'footprint_m':24000,
                      'p90_slope_deg':site['terrain']['metrics']['p90_slope_deg'],
                      'model_stable_ice_area_fraction':site.get('diviner',{}).get('ice_stable_within_1m_fraction') if site.get('diviner') else None,
                      'resource_classification':'Diviner model stability, not detected ice or abundance'})
        print(site['feature'],round(summary['visible_fraction']*100,2),'% sampled visibility',flush=True)
    payload={'contract':'terrainx-lunar-illumination-v1','generated_at':datetime.now(timezone.utc).isoformat(),
             'classification':'CALCULATED / BOUNDED GEOMETRY MODEL','frame':'MOON_ME (DE440_ME421 alignment)',
             'aberration':'CN+S, constant surface observer; apparent airless Sun centre',
             'period':['2025-01-01T00:00:00Z','2026-01-01T00:00:00Z'],'cadence_hours':1,'times_utc':times,
             'kernels':records,'source_lunar_product_sha256':hashlib.sha256(lunar_file.read_bytes()).hexdigest(),
             'crosschecks':checks,'sites':sites,
             'limitations':['IAU feature centres are not NASA landing-region polygons, landing ellipses or specific ridges.',
              'One calendar year at hourly midpoint samples, not a full18.6year lunar cycle or permanent-illumination/PSR determination. Dark runs are sampled and boundary-censored.',
              '7x7LOLA grid,4km spacing and24km footprint; interpolated72-ray horizon ignores relief between resolved samples and beyond the window;0degree horizon floor is a declared model assumption.',
              'Sun-centre visibility omits finite solar disk, panel tilt, eclipses by Earth, structures, solar power system losses and engineering access. A2m observer height is a scenario.',
              'Horizons comparisons test implementation against a second ephemeris service at four samples, not independent observations or mission validation.',
              'Diviner thermal/stability summaries and2025illumination are separate products/supports. No ice abundance, landing safety or base suitability score follows.']}
    payload=stable_science_json(ROOT/'data/derived/lunar_illumination.json',payload)
    atomic_json(ROOT/'frontend/public/data/lunar_illumination.json',payload);spice.kclear()

if __name__=='__main__':main()
