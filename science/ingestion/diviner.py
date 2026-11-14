"""Validate PDS Diviner PRP fixed-width records and model-only ice classifications."""
import hashlib,math,statistics,xml.etree.ElementTree as ET
import numpy as np
FIELDS={'tri_clon':(127,15,'degree'),'tri_clat':(144,15,'degree'),'temp_avg':(178,8,'Kelvin'),'temp_max':(188,8,'Kelvin'),'ice_depth':(198,11,'meter')}

def validate_label(text,sha256):
    if hashlib.sha256(text.encode('utf-8')).hexdigest()!=sha256:raise ValueError('Diviner label checksum mismatch')
    root=ET.fromstring(text);table=root.find('.//{*}Table_Character')
    if table is None or table.findtext('{*}offset')!='210' or table.findtext('{*}records')!='2880000' or table.findtext('.//{*}record_length')!='210':raise ValueError('Unexpected PRP layout')
    for name,(loc,length,unit) in FIELDS.items():
        field=next((f for f in table.findall('.//{*}Field_Character') if f.findtext('{*}name')==name),None)
        if field is None or (int(field.findtext('{*}field_location')),int(field.findtext('{*}field_length')),field.findtext('{*}unit'))!=(loc,length,unit):raise ValueError(f'Unexpected PRP field {name}')

def parse_record(record):
    if len(record)!=208:raise ValueError('Expected208-character PRP row')
    fields=record.split(',')
    if len(fields)!=15:raise ValueError('Expected15 PRP fields')
    xyz=np.asarray([float(v) for v in fields[:9]]).reshape(3,3)
    if not np.isfinite(xyz).all():raise ValueError('Invalid triangle coordinates')
    area=float(np.linalg.norm(np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]))/2)
    if not area>0:raise ValueError('Degenerate triangle')
    values={k:float(record[start-1:start-1+length]) for k,(start,length,_) in FIELDS.items()}
    if not all(math.isfinite(v) for v in values.values()):raise ValueError('Nonfinite PRP value')
    if not -90<=values['tri_clat']<=90 or not -360<=values['tri_clon']<=360:raise ValueError('Invalid planetocentric coordinate')
    for key in ('temp_avg','temp_max'):
        if not 0<values[key]<1000:values[key]=None
    ice=values['ice_depth']
    values['ice_class']='surface_stable' if ice==0 else 'subsurface_stable' if 0<ice<=2.8738 else 'deeper_than_model' if ice==-999 else 'unknown_code'
    return {**values,'area_km2':area}

def summarize(rows,threshold=110):
    if not rows:return None
    area=sum(r['area_km2'] for r in rows)
    fraction=lambda predicate:sum(r['area_km2'] for r in rows if predicate(r))/area
    thermal=[r for r in rows if r['temp_max'] is not None]
    valid_area=sum(r['area_km2'] for r in thermal)
    summary=lambda key:({'min':min(v),'median':statistics.median(v),'max':max(v)} if (v:=[r[key] for r in rows if r[key] is not None]) else None)
    stable=[r['ice_depth'] for r in rows if r['ice_class'] in ('surface_stable','subsurface_stable')]
    return {'triangles':len(rows),'sampled_triangle_area_km2':area,'thermal_valid_area_fraction':valid_area/area,
      'temp_max_k':summary('temp_max'),'temp_avg_k':summary('temp_avg'),
      'cold_trap_fraction':sum(r['area_km2'] for r in thermal if r['temp_max']<threshold)/valid_area if valid_area else None,
      'ice_surface_stable_fraction':fraction(lambda r:r['ice_class']=='surface_stable'),
      'ice_stable_within_1m_fraction':fraction(lambda r:r['ice_class'] in ('surface_stable','subsurface_stable') and r['ice_depth']<=1),
      'ice_stable_within_2_87m_fraction':fraction(lambda r:r['ice_class'] in ('surface_stable','subsurface_stable')),
      'ice_undocumented_code_fraction':fraction(lambda r:r['ice_class']=='unknown_code'),
      'ice_deeper_than_model_fraction':fraction(lambda r:r['ice_class']=='deeper_than_model'),
      'median_ice_depth_m':statistics.median(stable) if stable else None,
      'fraction_basis':'3D triangle surface area for triangles selected by centroid; boundary triangles are not clipped to the12.5km circle. Medians are unweighted triangle medians.'}
