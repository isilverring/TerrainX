"""Pure scale-aware terrain metrics; all horizontal/vertical inputs in meters."""
from __future__ import annotations
import numpy as np


def terrain_metrics(elevations, spacing_m: float, *, min_fraction: float = .90) -> dict:
    z = np.array([[np.nan if v is None else v for v in row] for row in elevations], dtype=float)
    if z.ndim != 2 or min(z.shape) < 3 or spacing_m <= 0 or not np.isfinite(spacing_m):
        raise ValueError("Invalid grid or spacing")
    valid = np.isfinite(z)
    if valid.mean() < min_fraction or valid.sum() < 9:
        raise ValueError("Insufficient valid terrain samples")
    # Central differences only: derivative baseline is2*spacing. Missing neighbors exclude slopes.
    gx = (z[1:-1,2:] - z[1:-1,:-2]) / (2*spacing_m)
    gy = (z[2:,1:-1] - z[:-2,1:-1]) / (2*spacing_m)
    slopes = np.degrees(np.arctan(np.hypot(gx, gy)))
    slopes = slopes[np.isfinite(slopes)]
    if slopes.size < 5:
        raise ValueError("Insufficient valid central-difference slopes")
    y, x = np.indices(z.shape)
    design = np.column_stack((x[valid]*spacing_m, y[valid]*spacing_m, np.ones(valid.sum())))
    fitted = design @ np.linalg.lstsq(design, z[valid], rcond=None)[0]
    relief = float(np.quantile(z[valid], .95) - np.quantile(z[valid], .05))
    width = (z.shape[1]-1)*spacing_m
    return {"median_slope_deg": float(np.median(slopes)), "p90_slope_deg": float(np.quantile(slopes,.90)), "relief_m": relief, "relative_relief": relief/width, "detrended_rms_m": float(np.sqrt(np.mean((z[valid]-fitted)**2))), "valid_samples": int(valid.sum()), "total_samples": int(z.size), "sample_spacing_m": spacing_m, "gradient_baseline_m": 2*spacing_m, "footprint_m": width, "classification": "DERIVED"}
