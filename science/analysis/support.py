"""Explicit common box support; synthetic inputs are used only in tests."""
from __future__ import annotations
import numpy as np
from .terrain import terrain_metrics
from .similarity import feature_similarity, TOLERANCES


def box_profile(z, coverage, cell_m=1000, support_m=8000, offset=(0, 0)):
    z, coverage = np.asarray(z, dtype=float), np.asarray(coverage, dtype=float)
    if z.shape != coverage.shape or z.ndim != 2 or z.shape[0] != z.shape[1]:
        raise ValueError('Aligned square working grids required')
    if support_m < 8000 or support_m % (2*cell_m) or 4000 % cell_m:
        raise ValueError('Support must be >=8 km and align with working-cell edges')
    n=z.shape[0]; grid=[]; fractions=[]
    for y in range(3, -4, -1):
        row=[]; cov=[]
        for x in range(-3, 4):
            xc=n/2+(x*4000+offset[0])/cell_m
            yc=n/2-(y*4000+offset[1])/cell_m
            half=support_m/(2*cell_m)
            bounds=[yc-half,yc+half,xc-half,xc+half]
            if any(v != int(v) for v in bounds) or min(bounds)<0 or max(bounds)>n:
                raise ValueError('Analysis support extends outside working grid')
            a,b,c,d=map(int,bounds); values=z[a:b,c:d]; weights=coverage[a:b,c:d]
            valid=np.isfinite(values)&np.isfinite(weights)&(weights>0)
            fraction=float(np.where(valid,weights,0).mean());cov.append(fraction)
            row.append(float(np.average(values[valid],weights=weights[valid])) if fraction>=.9 else None)
        grid.append(row);fractions.append(cov)
    try:
        metrics=terrain_metrics(grid,4000)
        status='available'
    except ValueError:
        metrics=None;status='unavailable'
    return {'status':status,'elevations_m':grid,'coverage_fractions':fractions,
            'minimum_coverage':min(min(row) for row in fractions),'metrics':metrics,
            'support_m':support_m,'sample_spacing_m':4000,'footprint_m':24000,
            'contributing_width_m':24000+support_m,'offset_east_north_m':list(offset),
            'working_cell_m':cell_m,'classification':'DERIVED'}


def supported_fidelity(earth, planet, native_max_m):
    # Shared aggregation support, footprint and slope baseline are necessary, not full PSF equivalence.
    if (not earth or not planet or earth['status']!='available' or planet['status']!='available'
        or earth['support_m']!=planet['support_m'] or earth['sample_spacing_m']!=planet['sample_spacing_m']
        or earth['footprint_m']!=planet['footprint_m'] or earth['support_m']<2*native_max_m):
        return {'value':None,'reason':'Insufficient compatible common-support data','components':[]}
    components=[{'feature':key,'earth':earth['metrics'][key],'planet':planet['metrics'][key],
                 'tolerance':tau,'similarity':feature_similarity(earth['metrics'][key],planet['metrics'][key],tau)} for key,tau in TOLERANCES.items()]
    return {'value':100*np.mean([c['similarity'] for c in components]),'reason':None,'components':components,
            'classification':'DERIVED / EXPERIMENTAL COMMON-SUPPORT PILOT'}
