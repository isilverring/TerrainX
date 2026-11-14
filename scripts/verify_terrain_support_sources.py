"""Validate staged real Copernicus files; never alter tracked source files."""
from pathlib import Path
import hashlib,json,math,sys,xml.etree.ElementTree as ET
import numpy as np
import rasterio
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/m5-assets';SOURCE=ROOT/'data/source/pilot'
manifest=json.loads(((OUT/'manifest.proposed.json') if (OUT/'manifest.proposed.json').exists() else SOURCE/'manifest.expanded.json').read_text())
OUT.mkdir(parents=True,exist_ok=True)
errors=[];alignments={};rasters=0;xmls=0
def locate(asset):
 staged=OUT/'cache'/asset['relative_path']
 return staged if staged.exists() else SOURCE/asset['relative_path']
for a in manifest['assets']:
 try:
  p=locate(a);b=p.read_bytes()
  if len(b)!=a['bytes'] or hashlib.sha256(b).hexdigest()!=a['sha256']:raise ValueError('Checksum/length mismatch')
  if a['kind'] in ('DEM','EDM','FLM','WBM'):
   with rasterio.open(p) as ds:
    if ds.crs.to_epsg()!=4326 or ds.shape!=(1200,1200) or ds.count!=1 or not math.isclose(ds.res[0],1/1200) or not math.isclose(ds.res[1],1/1200):raise ValueError('Unexpected raster geometry')
    if ds.tags().get('AREA_OR_POINT')!='Point':raise ValueError('Unexpected pixel registration')
    if a['kind']=='DEM' and ds.dtypes[0]!='float32':raise ValueError('Unexpected DEM encoding')
    if a['kind']!='DEM' and ds.dtypes[0]!='uint8':raise ValueError('Unexpected mask encoding')
    key=a['tile_id'];transform=list(ds.transform)
    if key in alignments and alignments[key]!=transform:raise ValueError('Unaligned quality mask')
    alignments[key]=transform
    values=ds.read(1,masked=True);raw=values.compressed();finite=raw[np.isfinite(raw)]
    if not finite.size:raise ValueError('Entire raster is masked/nonfinite')
    stats={'driver':ds.driver,'width':ds.width,'height':ds.height,'count':ds.count,'dtype':ds.dtypes[0],'crs':str(ds.crs),'transform':transform,'bounds':list(ds.bounds),'pixel_spacing_degrees':list(ds.res),'nodata':ds.nodata,'units':list(ds.units),'scales':list(ds.scales),'offsets':list(ds.offsets),'area_or_point':ds.tags().get('AREA_OR_POINT'),'all_pixels_read':True,'finite_pixel_count':int(finite.size),'total_pixel_count':int(values.size),'minimum':float(finite.min()),'maximum':float(finite.max()),'raster_mask_valid_pixel_count':int(np.count_nonzero(ds.read_masks(1)))}
    if a['kind']!='DEM':
     codes,counts=np.unique(finite,return_counts=True);valid={'EDM':range(0,14),'FLM':[0,1,2,3,4,5,6,7,8,9,100,101,102],'WBM':[0,1,2,3]}[a['kind']]
     if not np.isin(codes,list(valid)).all():raise ValueError('Undocumented quality code')
     stats['code_counts']={str(int(k)):int(v) for k,v in zip(codes,counts)}
    a['raster']=stats;rasters+=1
  elif a['kind']=='metadata':
   root=ET.fromstring(b);systems=' '.join(''.join(e.itertext()) for e in root.findall('./{*}referenceSystemInfo'))
   axis=root.find('.//{*}EX_VerticalExtent/{*}verticalCRS/{*}VerticalCRS/{*}verticalCS/{*}VerticalCS/{*}axis/{*}CoordinateSystemAxis')
   extent=root.find('.//{*}productDetails/{*}productExtent/{*}frameCoordsGeographic/{*}EPSG')
   if 'EGM08' not in systems or axis is None or axis.get('{http://www.opengis.net/gml}uom')!='metre' or extent is None or extent.text!='4326':raise ValueError('XML horizontal CRS/vertical metres/EGM08 validation failed')
   start=root.find('.//{*}tsxx_startTime');end=root.find('.//{*}tsxx_stopTime')
   a['source_acquisition_period']={'start':start.text if start is not None else None,'end':end.text if end is not None else None,'scope':'Original TanDEM-X acquisition coverage in XML; infill sources may differ.'}
   a['metadata_validation']={'horizontal_epsg':4326,'vertical_unit':'metre','vertical_reference':'EGM2008','reference_system_text':systems.strip()}
   xmls+=1
  elif a['kind']=='licence' and not b.startswith(b'%PDF-'):raise ValueError('Licence is not a PDF')
 except Exception as e:errors.append({'path':a['relative_path'],'error':str(e)})
missing=[]
for p in manifest['pilots']:
 for tile in p['tile_ids']:
  for kind in ['DEM','EDM','FLM','WBM','metadata']:
   if not any(a['tile_id']==tile and a['kind']==kind for a in manifest['assets']):missing.append({'site':p['id'],'tile':tile,'kind':kind})
manifest['licence_files']={}
for tile in {t for p in manifest['pilots'] for t in p['tile_ids']}:
 ending=f'Copernicus_DSM_COG_30_{tile}_DEM/INFO/eula_F.pdf'
 asset=next((a for a in manifest['assets'] if a['kind']=='licence' and a['url'].endswith(ending)),None)
 if asset:manifest['licence_files'][tile]=asset['relative_path']
 else:missing.append({'tile':tile,'kind':'licence'})
report={'sites':len(manifest['pilots']),'tiles':len(alignments),'rasters':rasters,'metadata':xmls,'errors':errors,'missing':missing,'acquisition_errors':manifest.get('acquisition_errors',[]),'absent_objects':manifest.get('absent_objects',[]),'complete':not errors and not missing and not manifest.get('acquisition_errors') and not manifest.get('absent_objects')}
manifest['complete']=report['complete'];manifest['validation']=report
(OUT/'manifest.validated.json').write_text(json.dumps(manifest,indent=2,allow_nan=False)+'\n',encoding='utf-8')
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
if not report['complete']:sys.exit(1)
