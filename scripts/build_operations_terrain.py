"""Build actual 250m route-screening lattices from existing verified Copernicus DSMs."""
from __future__ import annotations
import hashlib,json,math,sys
from pathlib import Path
from contextlib import ExitStack
from datetime import datetime,timezone
import numpy as np
import rasterio
from rasterio.merge import merge
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from science.ingestion.mola import point_from_offset
from science.ingestion.cache import stable_science_json,atomic_json


def main():
    folder=ROOT/'data/source/pilot';manifest=json.loads((folder/'manifest.expanded.json').read_text(encoding='utf-8'))
    candidates={c['id']:c for c in json.loads((ROOT/'data/derived/field_candidates.json').read_text(encoding='utf-8'))['candidates']}
    candidates.update({c['id']:c for c in json.loads((ROOT/'data/derived/dataset.json').read_text(encoding='utf-8'))['candidates']})
    verified=set();results=[]
    for pilot in manifest['pilots']:
        assets=[a for a in manifest['assets'] if a['tile_id'] in pilot['tile_ids'] and a['kind'] in ['DEM','EDM','FLM','WBM']]
        arrays={};transform=None
        for kind in ['DEM','EDM','FLM','WBM']:
            selected=[a for a in assets if a['kind']==kind]
            for asset in selected:
                p=(folder/asset['relative_path']).resolve()
                if not p.is_relative_to(folder.resolve()):raise ValueError('Unsafe source path')
                if p not in verified:
                    if p.stat().st_size!=asset['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest()!=asset['sha256']:raise ValueError('Source checksum mismatch')
                    verified.add(p)
            with ExitStack() as stack:
                sources=[stack.enter_context(rasterio.open(folder/a['relative_path'])) for a in selected]
                if not sources or any(s.crs.to_epsg()!=4326 or s.shape!=(1200,1200) for s in sources):raise ValueError('Unsupported source grid')
                values,t=merge(sources,nodata=np.nan,dtype='float64')
                if transform is not None and (t!=transform or values[0].shape!=arrays['DEM'].shape):raise ValueError('Unaligned masks')
                transform=t;arrays[kind]=values[0]
        grid=[];water=void=filled=0;points=[]
        for i in range(97):
            row=[]
            for j in range(97):
                lat,lon=point_from_offset(pilot['latitude'],pilot['longitude'],(j-48)*250,(48-i)*250,6371000)
                lon=(lon+180)%360-180
                col,r=~transform*(lon,lat);r,col=math.floor(r),math.floor(col)
                if not (0<=r<arrays['DEM'].shape[0] and 0<=col<arrays['DEM'].shape[1]):raise ValueError('Window outside verified tiles')
                z,edm,flm,wbm=(arrays[k][r,col] for k in ['DEM','EDM','FLM','WBM'])
                valid=np.isfinite([z,edm,flm,wbm]).all() and edm>0 and flm>0
                if not valid:void+=1
                elif wbm>0:water+=1
                elif flm>=3:filled+=1
                row.append(round(float(z),1) if valid and wbm==0 else None)
            grid.append(row)
        c=candidates[pilot['id']]
        result={"id":pilot['id'],"name":c['name'],"latitude":pilot['latitude'],"longitude":pilot['longitude'],
                "elevations_m":grid,"shape":[97,97],"sample_spacing_m":250,"footprint_m":24000,
                "slope_baseline_m":500,"native_spacing_arcsec":3,"vertical_reference":"EGM2008 geoid; metres",
                "valid_land_samples":sum(v is not None for row in grid for v in row),"water_excluded_samples":water,"void_samples":void,"external_fill_land_samples":filled,
                "sources":[{k:a[k] for k in ['url','sha256','bytes','retrieved_at','kind']} for a in assets]}
        results.append(result);print(c['id'],result['valid_land_samples'],'valid land nodes',flush=True)
    payload={"contract":"terrainx-operations-terrain-v1","generated_at":datetime.now(timezone.utc).isoformat(),
             "source_manifest_sha256":hashlib.sha256((folder/'manifest.expanded.json').read_bytes()).hexdigest(),
             "source":"Copernicus GLO-90 DSM (2021 AWS release)","source_url":manifest['official_collection_url'],
             "classification":"DERIVED FROM VERIFIED DSM / PROPOSED ROUTES", "profiles":results,
             "limitations":["Nearest source pixel on a250m spherical-AEQD sample lattice; not250m sensor resolution. Native3arcsecond DSM includes vegetation/buildings, edits and external infill.","Water/void nodes excluded under a declared land-only routing scenario. Other hazards, access, boulders, bearing strength, traction and wheel-soil mechanics are unassessed.","Graph edges test sampled elevation differences, not continuous terrain safety. Diagonal corner cutting is prohibited. Neither a landing certification nor a field route clearance."]}
    payload=stable_science_json(ROOT/'data/derived/operations_terrain.json',payload)
    atomic_json(ROOT/'frontend/public/data/operations_terrain.json',payload)

if __name__=='__main__':main()
