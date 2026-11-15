"""Geometric Sun angles and bounded DEM horizon screening; never a PSR survey."""
from __future__ import annotations
import math
import numpy as np
from science.ingestion.mola import point_from_offset


def local_basis(latitude: float, longitude: float):
    if not (-90 <= latitude <= 90) or not math.isfinite(longitude):
        raise ValueError("Invalid planetocentric coordinates")
    p, l = np.radians([latitude, longitude])
    return (np.array([-math.sin(l), math.cos(l), 0.0]),
            np.array([-math.sin(p)*math.cos(l), -math.sin(p)*math.sin(l), math.cos(p)]),
            np.array([math.cos(p)*math.cos(l), math.cos(p)*math.sin(l), math.sin(p)]))


def sun_angles(vector, latitude: float, longitude: float):
    """Vector points from observer toward Sun, in the site's body-fixed frame."""
    v = np.asarray(vector, dtype=float)
    if v.shape != (3,) or not np.isfinite(v).all() or np.linalg.norm(v) <= 0:
        raise ValueError("A finite nonzero Sun vector is required")
    east, north, up = local_basis(latitude, longitude)
    unit = v / np.linalg.norm(v)
    return (math.degrees(math.atan2(float(unit@east), float(unit@north))) % 360,
            math.degrees(math.asin(float(np.clip(unit@up, -1, 1)))))


def _height(grid, x, y, spacing):
    n = grid.shape[0];c=(n-1)/2+x/spacing;r=(n-1)/2-y/spacing
    if not (0<=r<=n-1 and 0<=c<=n-1):return None
    i,j=min(int(r),n-2),min(int(c),n-2);dr,dc=r-i,c-j
    corners=grid[i:i+2,j:j+2]
    if not np.isfinite(corners).all():return None
    return float(corners[0,0]*(1-dc)*(1-dr)+corners[0,1]*dc*(1-dr)+corners[1,0]*(1-dc)*dr+corners[1,1]*dc*dr)


def sampled_horizon(grid, spacing_m: float, latitude: float, longitude: float,
                    radius_m=1737400.0, observer_height_m=2.0, bins=72):
    z=np.asarray(grid,dtype=float)
    if z.ndim!=2 or z.shape[0]!=z.shape[1] or z.shape[0]%2!=1 or z.shape[0]<3:
        raise ValueError("Odd square measured terrain grid required")
    if not np.isfinite(z).all() or spacing_m<=0 or radius_m<=0 or observer_height_m<0 or bins<4:
        raise ValueError("Invalid/missing horizon inputs")
    middle=z.shape[0]//2;extent=middle*spacing_m
    east,north,up=local_basis(latitude,longitude)
    observer=(radius_m+z[middle,middle]+observer_height_m)*up
    angles=[];distances=[]
    for k in range(bins):
        az=2*math.pi*k/bins;limit=extent/max(abs(math.sin(az)),abs(math.cos(az)))
        highest=0.0  # declared 0° floor, NOT evidence about terrain outside this window
        for d in np.arange(spacing_m/2,limit+1e-6,spacing_m/2):
            lat,lon=point_from_offset(latitude,longitude,d*math.sin(az),d*math.cos(az),radius_m)
            _,_,radial=local_basis(lat,lon)
            h=_height(z,d*math.sin(az),d*math.cos(az),spacing_m)
            if h is None:raise ValueError("Incomplete ray support")
            direction=(radius_m+h)*radial-observer
            angle=math.degrees(math.atan2(float(direction@up),math.hypot(float(direction@east),float(direction@north))))
            highest=max(highest,angle)
        angles.append(round(highest,5));distances.append(round(limit,1))
    return {"azimuth_step_deg":360/bins,"elevation_deg":angles,"ray_extent_m":distances,
            "observer_height_m":observer_height_m,"radius_m":radius_m,
            "method":"Bilinear DEM rays at half the analysis spacing; spherical curvature; max(0°, sampled obstruction). No terrain beyond the window, unresolved relief, finite solar disk or equipment occlusion."}


def horizon_at(azimuth_deg, horizon):
    a=np.asarray(azimuth_deg,dtype=float)%360;values=np.asarray(horizon,dtype=float)
    if values.ndim!=1 or len(values)<4 or not np.isfinite(values).all():raise ValueError("Invalid horizon")
    pos=a*len(values)/360;i=np.floor(pos).astype(int);f=pos-i
    return values[i]*(1-f)+values[(i+1)%len(values)]*f


def light_summary(elevation_deg, azimuth_deg, horizon, cadence_hours=1.0):
    elevation=np.asarray(elevation_deg,dtype=float);azimuth=np.asarray(azimuth_deg,dtype=float)
    if elevation.shape!=azimuth.shape or elevation.ndim!=1 or not len(elevation) or not np.isfinite(elevation).all() or not np.isfinite(azimuth).all() or cadence_hours<=0:
        raise ValueError("Complete aligned geometry samples required")
    limit=horizon_at(azimuth,horizon);lit=elevation>limit
    longest=run=0
    for visible in lit:
        run=0 if visible else run+1;longest=max(longest,run)
    return {"visible_fraction":float(lit.mean()),"geometric_above_zero_fraction":float((elevation>0).mean()),
            "max_sampled_dark_run_hours":longest*cadence_hours,"boundary_darkness_censored":bool(not lit[0] or not lit[-1]),
            "visible_samples":int(lit.sum()),"samples":len(lit),"visibility":lit.tolist()}
