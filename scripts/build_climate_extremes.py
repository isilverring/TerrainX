"""Retrieve and preserve real2025 POWER daily2m air temperatures/wind for18 study sites."""
from __future__ import annotations
import json,sys,ssl
from pathlib import Path
from datetime import datetime,timezone,date,timedelta
from concurrent.futures import ThreadPoolExecutor
import httpx,numpy as np
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from science.ingestion.cache import CachedHTTP,stable_science_json,atomic_json
PARAMETERS={'T2M_MIN':{'C','degC'},'T2M_MAX':{'C','degC'},'WS10M':{'m/s'},'PS':{'kPa'}}
URL='https://power.larc.nasa.gov/api/temporal/daily/point'


def main():
    selection=json.loads((ROOT/'data/source/pilot/manifest.expanded.json').read_text(encoding='utf-8'))['pilots']
    start=date(2025,1,1);dates=[(start+timedelta(days=i)).strftime('%Y%m%d') for i in range(365)]
    def profile(site):
        client=CachedHTTP();client.client.close();client.client=httpx.Client(timeout=120,follow_redirects=True,verify=ssl.create_default_context())
        try:
            record=client.get(URL,{'latitude':site['latitude'],'longitude':site['longitude'],'parameters':','.join(PARAMETERS),'community':'AG','start':'20250101','end':'20251231','format':'JSON'})
            data=record['data'];header=data['header'];values=data['properties']['parameter'];meta=data['parameters'];fill=header.get('fill_value',-999)
            variables={}
            for key,units in PARAMETERS.items():
                unit=meta[key]['units']
                if unit not in units:raise ValueError(f'Unexpected actual unit for{key}:{unit}')
                series=[values[key].get(d) for d in dates];series=[float(v) if isinstance(v,(int,float)) and np.isfinite(v) and v!=fill else None for v in series]
                good=[v for v in series if v is not None]
                variables[key]={'unit':unit,'long_name':meta[key]['longname'],'values':series,'valid_days':len(good),
                                'min':min(good) if good else None,'max':max(good) if good else None,
                                'p05':float(np.quantile(good,.05)) if good else None,'p95':float(np.quantile(good,.95)) if good else None}
            out={'id':site['id'],'latitude':site['latitude'],'longitude':site['longitude'],'status':'available','variables':variables,
                 'source_url':record['url'],'sha256':record['sha256'],'retrieved_at':record['retrieved_at'],'source_header':header}
            print(site['id'],variables['T2M_MIN']['min'],variables['T2M_MAX']['max'],flush=True);return out
        except Exception as error:
            print(site['id'],'unavailable',str(error),flush=True)
            return {'id':site['id'],'latitude':site['latitude'],'longitude':site['longitude'],'status':'unavailable','reason':str(error),'variables':{},'source_url':URL}
        finally:client.client.close()
    with ThreadPoolExecutor(max_workers=3) as pool:profiles=list(pool.map(profile,selection))
    payload={'contract':'terrainx-daily-extremes-v1','generated_at':datetime.now(timezone.utc).isoformat(),'dates':dates,'period':['2025-01-01','2025-12-31'],'profiles':profiles,
             'classification':'NASA POWER GRIDDED DAILY DATA / DERIVED ONE-YEAR EXTREMES','source_url':URL,
             'limitations':['Extrema of available2025daily2m air temperatures over coarse MERRA-2 grid support, not rock/surface temperatures, in-situ weather stations, long-term return levels or planetary thermal equivalents.',
              'WS10M is daily mean10m wind; its maximum here is the maximum daily mean, not a gust or dust storm observation. Missing/fill values remain null.',
              'These18selected source-support sites are separate from the full130cell climatology. Retrieval failures remain explicitly unavailable.']}
    payload=stable_science_json(ROOT/'data/derived/climate_extremes.json',payload)
    atomic_json(ROOT/'frontend/public/data/climate_extremes.json',payload)

if __name__=='__main__':main()
