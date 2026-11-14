"""Unit-validated Earth climatology descriptors, not planetary equivalence scores."""
from science.ingestion.power import clean,MONTHS,acquisition_period

EXPECTED={'T2M_MAX':{'C'},'T2M_MIN':{'C'},'GWETTOP':{'1'},'GWETROOT':{'1'},'FROST_DAYS':{'Days'},'AOD_55':{'dimensionless'}}
def environmental_summary(record):
    data=record['data'];fill=data.get('header',{}).get('fill_value',-999);par=data['properties']['parameter'];units={k:data['parameters'][k]['units'] for k in par}
    for key,allowed in EXPECTED.items():
        if key in par and units[key] not in allowed:raise ValueError(f'Unexpected {key} unit: {units[key]}')
    monthly={k:[clean(v.get(m),fill) for m in MONTHS] for k,v in par.items()}
    annual={k:clean(v.get('ANN'),fill) for k,v in par.items()}
    for key in ('GWETTOP','GWETROOT'):
        if annual.get(key) is not None and not 0<=annual[key]<=1:raise ValueError('Model wetness index outside0..1')
    if annual.get('AOD_55') is not None and annual['AOD_55']<0:raise ValueError('Negative aerosol optical depth')
    complete=lambda key:len(monthly.get(key,[]))==12 and all(v is not None for v in monthly[key])
    warm=max(monthly['T2M_MAX']) if complete('T2M_MAX') else None
    cold=min(monthly['T2M_MIN']) if complete('T2M_MIN') else None
    return {'warmest_month_max_c':warm,'coldest_month_min_c':cold,'annual_span_c':warm-cold if warm is not None and cold is not None else None,
      'frost_days_per_year':sum(monthly['FROST_DAYS']) if complete('FROST_DAYS') else None,
      'soil_wetness_top':annual.get('GWETTOP'),'soil_wetness_root':annual.get('GWETROOT'),'aerosol_optical_depth_550':annual.get('AOD_55'),
      'units':units,'period':data.get('header',{}).get('range'),'acquisition_period':acquisition_period(data.get('header',{})),
      'source_url':record['url'],'sha256':record['sha256'],'retrieved_at':record['retrieved_at'],
      'classification':'DERIVED FROM GRIDDED REANALYSIS',
      'interpretation':'Monthly climatological mean daily air-temperature maxima/minima, not absolute extremes. GWET is model relative soil wetness, not ice or volumetric water. AOD550 is column aerosol extinction, not dust-specific surface loading.'}
