"""Reproduce the separate common-support pilot from checksum-verified real rasters.

No existing SRTM observation, candidate ranking or scientific release is overwritten.
Downloads only missing public Copernicus assets; use build_planetary_profiles.py first.
"""
from __future__ import annotations
import hashlib, json, math, sys
import xml.etree.ElementTree as ET
from pathlib import Path
from contextlib import ExitStack
import numpy as np
import rasterio
from rasterio.merge import merge
from rasterio.transform import from_origin
from rasterio.warp import reproject, Resampling
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from science.ingestion.mola import read_product_metadata, download_cached, point_from_offset
from science.analysis.support import box_profile, supported_fidelity
from science.analysis.terrain import terrain_metrics
from science.analysis.similarity import TOLERANCES, feature_similarity

SOURCE=ROOT/'data/source/pilot'
MANIFEST=json.loads((SOURCE/'manifest.json').read_text(encoding='utf-8'))
DATA=json.loads((ROOT/'frontend/public/data/dataset.json').read_text(encoding='utf-8'))
EXTENT=24000

def verify_assets():
    for asset in MANIFEST['assets']:
        target=(SOURCE/asset['relative_path']).resolve()
        if not target.is_relative_to(SOURCE.resolve()):raise ValueError('Unsafe cache path')
        if not target.exists(): download_cached(asset['url'],target)
        if target.stat().st_size!=asset['bytes'] or hashlib.sha256(target.read_bytes()).hexdigest()!=asset['sha256']:
            raise ValueError(f'Source checksum mismatch: {target}')

def project(values, source_transform, source_crs, lat, lon, radius, cell=1000, nodata=np.nan):
    n=int(2*EXTENT/cell);output=np.full((n,n),np.nan,dtype='float64')
    crs=f'+proj=aeqd +lat_0={lat} +lon_0={lon} +R={radius} +units=m +no_defs'
    reproject(values,output,src_transform=source_transform,src_crs=source_crs,src_nodata=nodata,
              dst_transform=from_origin(-EXTENT,EXTENT,cell,cell),dst_crs=crs,dst_nodata=np.nan,
              resampling=Resampling.average,num_threads=1)
    return output

def earth_source(pilot):
    arrays={};transform=None
    assets=[a for a in MANIFEST['assets'] if a['tile_id'] in pilot['tile_ids']]
    for asset in (a for a in assets if a['kind']=='metadata'):
        root=ET.parse(SOURCE/asset['relative_path']).getroot()
        systems=' '.join(''.join(e.itertext()) for e in root.findall('./{*}referenceSystemInfo'))
        axis=root.find('.//{*}EX_VerticalExtent/{*}verticalCRS/{*}VerticalCRS/{*}verticalCS/{*}VerticalCS/{*}axis/{*}CoordinateSystemAxis')
        extent=root.find('.//{*}productDetails/{*}productExtent/{*}frameCoordsGeographic/{*}EPSG')
        if 'EGM08' not in systems or axis is None or axis.get('{http://www.opengis.net/gml}uom')!='metre' or extent is None or extent.text!='4326':
            raise ValueError('Partner XML does not validate horizontal CRS / EGM2008 metres')
    for kind in ('DEM','EDM','FLM','WBM'):
        with ExitStack() as stack:
            datasets=[stack.enter_context(rasterio.open(SOURCE/a['relative_path'])) for a in assets if a['kind']==kind]
            for ds in datasets:
                if ds.crs.to_epsg()!=4326 or ds.shape!=(1200,1200) or not math.isclose(ds.res[0],1/1200):
                    raise ValueError('Unexpected partner raster geometry')
                if kind=='DEM' and (ds.dtypes[0]!='float32' or ds.tags().get('AREA_OR_POINT')!='Point'):
                    raise ValueError('Unexpected DSM encoding/registration')
            array,current=merge(datasets,nodata=np.nan,dtype='float64')
            if transform is not None and (current!=transform or array[0].shape!=arrays['DEM'].shape):raise ValueError('Unaligned quality mask')
            transform=current;arrays[kind]=array[0]
    z=arrays['DEM'];valid=np.isfinite(z)&np.isfinite(arrays['EDM'])&np.isfinite(arrays['FLM'])&(arrays['EDM']>0)&(arrays['FLM']>0)
    if not np.isin(arrays['EDM'][valid],range(1,14)).all() or not np.isin(arrays['FLM'][valid],[1,2,3,4,5,6,7,8,9,100,101,102]).all() or not np.isin(arrays['WBM'][valid],[0,1,2,3]).all():raise ValueError('Unknown quality code')
    z=np.where(valid,z,np.nan)
    args=(transform,'EPSG:4326',pilot['latitude'],pilot['longitude'],6371000)
    grids={cell:project(z,*args,cell=cell) for cell in (1000,500)}
    coverage={cell:np.nan_to_num(project(valid.astype(float),*args,cell=cell,nodata=None),nan=0) for cell in (1000,500)}
    quality={name:project(flag.astype(float),*args,nodata=None) for name,flag in {
        'water_surface':valid&(arrays['WBM']>0),'external_fill':valid&(arrays['FLM']>=3),
        'edited':valid&(arrays['EDM']!=1)}.items()}
    # Bilinear same-source point baseline, using exact GDAL pixel-center registration.
    points=[]
    for y in range(3,-4,-1):
        row=[]
        for x in range(-3,4):
            lat,lon=point_from_offset(pilot['latitude'],pilot['longitude'],x*4000,y*4000,6371000)
            col,rr=(~transform)*(lon,lat);r,c=math.floor(rr-.5),math.floor(col-.5);dy,dx=rr-.5-r,col-.5-c
            v=z[r:r+2,c:c+2];weights=np.array([[(1-dx)*(1-dy),dx*(1-dy)],[(1-dx)*dy,dx*dy]])
            row.append(float(np.sum(v*weights)) if np.isfinite(v).all() else None)
        points.append(row)
    return grids,coverage,quality,points,assets

def planet_source(target):
    cache=ROOT/'data/source/planetary';moon=target['id']=='mare-crisium'
    stem='ldem_16' if moon else 'megt90n000eb'
    # On disk labels use the archive's actual lower/upper-case filename.
    files={p.name.lower():p for p in cache.iterdir()}
    metadata=read_product_metadata(files[stem+'.xml'],files[stem+'.lbl'])
    image=files[stem+'.img']
    if image.stat().st_size!=metadata['lines']*metadata['samples']*2:raise ValueError('Incomplete PDS raster')
    record=next(a for a in json.loads((cache/'manifest.json').read_text(encoding='utf-8'))['sources'] if a['file'].lower()==image.name.lower())
    if hashlib.sha256(image.read_bytes()).hexdigest()!=record['sha256']:raise ValueError('PDS checksum mismatch')
    lat,lon=target['latitude'],target['longitude'];ppd=metadata['pixels_per_degree']
    extent=math.degrees(40000/metadata['map_sphere_radius_m'])/math.cos(math.radians(lat))
    top=max(0,math.floor((90-lat-extent)*ppd));bottom=min(2880,math.ceil((90-lat+extent)*ppd))
    left=math.floor((lon-extent)*ppd);right=math.ceil((lon+extent)*ppd)
    full=np.memmap(image,dtype='<i2' if moon else '>i2',mode='r',shape=(2880,5760))
    raw=np.array(full[top:bottom,left:right],dtype=float)
    low,high=metadata['valid_dn_range'];raw[(raw<low)|(raw>high)]=np.nan
    z=raw*metadata['height_scale'];transform=from_origin(left/ppd,90-top/ppd,1/ppd,1/ppd)
    radius=metadata['map_sphere_radius_m'];crs=f'+proj=longlat +R={radius} +no_defs'
    grids={cell:project(z,transform,crs,lat,lon,radius,cell=cell) for cell in (1000,500)}
    cover={cell:np.nan_to_num(project(np.isfinite(z).astype(float),transform,crs,lat,lon,radius,cell=cell,nodata=None),nan=0) for cell in (1000,500)}
    native=math.pi*radius/(180*ppd)
    return grids,cover,native,metadata,record

def point_fidelity(grid,planet):
    try:metrics=terrain_metrics(grid,4000)
    except ValueError:return {'value':None,'metrics':None}
    return {'value':100*sum(feature_similarity(metrics[k],planet['metrics'][k],t) for k,t in TOLERANCES.items())/4,'metrics':metrics,'elevations_m':grid}

def main():
    verify_assets();planets={t['id']:(t,planet_source(t)) for t in DATA['targets']};results=[]
    for pilot in MANIFEST['pilots']:
        earth,cov,quality,points,assets=earth_source(pilot)
        candidate=next(c for c in DATA['candidates'] if c['id']==pilot['id'])
        for mission,(target,(planet,pcov,native,metadata,record)) in planets.items():
            scenarios=[]
            for support in (8000,12000):
                for label,offset in [('center',(0,0)),('east',(4000,0)),('west',(-4000,0)),('north',(0,4000)),('south',(0,-4000))]:
                    e=box_profile(earth[1000],cov[1000],support_m=support,offset=offset)
                    p=box_profile(planet[1000],pcov[1000],support_m=support,offset=offset)
                    fidelity=supported_fidelity(e,p,native)
                    entry={'support_m':support,'offset':label,'earth':e,'planet':p,'fidelity':fidelity}
                    if label=='center':
                        fine_e=box_profile(earth[500],cov[500],cell_m=500,support_m=support)
                        fine_p=box_profile(planet[500],pcov[500],cell_m=500,support_m=support)
                        fine_f=supported_fidelity(fine_e,fine_p,native)
                        entry['quadrature_check']={'fine_working_cell_m':500,'fidelity':fine_f['value'],'absolute_score_delta':abs(fidelity['value']-fine_f['value']) if fidelity['value'] is not None and fine_f['value'] is not None else None}
                        entry['earth_quality_fractions']={key:float(np.nanmean(box_profile(value,np.ones(value.shape),support_m=support)['elevations_m'])) for key,value in quality.items()}
                    scenarios.append(entry)
            results.append({'candidate_id':candidate['id'],'candidate_name':candidate['name'],'benchmark':candidate['benchmark'],
                'latitude':pilot['latitude'],'longitude':pilot['longitude'],'mission':mission,'target':target['name'],
                'original_srtm_fidelity':candidate['assessments'][mission]['fidelity']['value'],
                'partner_point_baseline':point_fidelity(points,target['terrain']),
                'planet_native_resolution_m':native,'planet_metadata':metadata,'planet_source':record,
                'earth_sources':assets,'scenarios':scenarios})
    output={'schema_version':'1.0','model':'terrainx-support-pilot-v1','classification':'DERIVED / EXPERIMENTAL',
      'attribution':'Produced using Copernicus WorldDEM-90 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.',
      'method':{'working_grid_m':1000,'quadrature_check_m':500,'projection':'Spherical local azimuthal equidistant on each source body; actual PDS radius, Earth6371000m.',
      'resampling':'GDAL area-weighted average into a local working lattice, then coverage-weighted square box means. Oversampled planetary working cells introduce no new observations. This approximates common aggregation support; native instrument response is still unequal.',
      'sample_spacing_m':4000,'gradient_baseline_m':8000,'center_footprint_m':24000,'box_supports_m':[8000,12000],
      'offsets_m':4000,'minimum_valid_area_fraction':.9,'tolerances':TOLERANCES},
      'limitations':['Experimental two-site pilot, not a revised discovery ranking. Original SRTM F/U/C/P remain unchanged.',
        'Source change and smoothing effects are distinct: compare the Copernicus point baseline to its filtered results, not only to SRTM.',
        'Common box support does not calibrate native point-spread functions, measurement errors or mission-safety thresholds.',
        'DSM represents vegetation/buildings and edited water surfaces. Lake Salda water pixels are not bathymetry.',
        'Native MOLA/LOLA products include source-team interpolation; mask coverage is raster availability, not independent instrument coverage.',
        'Offsets, filter sizes and numerical lattice checks describe sensitivity to processing choices, not statistical confidence.',
        'Different vertical reference surfaces: absolute elevations never enter fidelity. No geology or rover-scale hazard claim follows.'],
      'source_manifest':MANIFEST,'results':results}
    body=json.dumps(output,indent=2,allow_nan=False)+'\n'
    for destination in (ROOT/'data/derived/terrain_pilot.json',ROOT/'frontend/public/data/terrain_pilot.json'):
        destination.write_text(body,encoding='utf-8')
    for item in results:
        values=[s['fidelity']['value'] for s in item['scenarios'] if s['fidelity']['value'] is not None]
        print(f"{item['candidate_id']} / {item['mission']}: {len(values)} valid scenarios, F range {min(values):.3f}..{max(values):.3f}")

if __name__=='__main__':main()
