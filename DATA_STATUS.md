# Scientific data status

Acquisition complete with no errors. Verified regional responses contain 130 real grid cells (25Saudi,35Botswana,35Chile,35Gobi). Deterministic search selected 16 automatic candidates. All 16 plus 4 separately labelled benchmarks have real POWER point and SRTM terrain profiles. Macrostrat returned mapped units for 19 of 20 locations. Ten automatic candidates have enough mapped evidence for a preliminary mission-specific hypothesis; none is field-validated.

The deployable release is `data/derived/dataset.json`, copied to `frontend/public/data/dataset.json`. Successful raw JSON payloads and retrieval records are versioned in `data/cached/`. Derived annual precipitation, seasonal range, terrain metrics and F/U/C preserve links to their source observations.

Both MOLA and LOLA rasters are available and validated. Extracted 49-point target grids are in `planetary_targets.json`. Native source pixels, labels, checksums and acquisition metadata are under `data/source/planetary/`. Original 33MB rasters remain local and are reproducibly downloadable.

POWER precipitation units are mm/day; annual proxy is 365.25×daily. Actual meteorological grid is 0.5°×0.625°, 2001–2025. Solar flux under AG is MJ/m²/day. Coarse grid climatology is not an outcrop instrument measurement.

Required sources: NASA POWER regional and point climatology, NASA SRTM via OpenTopoData, MOLA, LOLA, NASA GIBS, NASA mission references, and Macrostrat.

Benchmark subsite evidence takes precedence over broad regional lithology. In particular, the Salda hydromagnesite shoreline benchmark cannot gain lunar basalt relevance from a coarse ophiolite map polygon. Unknown remains null.

The search applies a broad Natural Earth 110m land mask before shortlist selection. All 130 precipitation cells remain in the GeoJSON; coast/water-screened centers are not silently removed from the research record. The mask is not field-scale coastline validation.

**Visualisation-only context (2026-11-14).** `data/derived/planetary_context.json` (also in `frontend/public/data/`) holds 49×49, 2 km, 96 km MOLA and LOLA context grids for the 3D viewer, built from the committed native DN windows `data/source/planetary/*_context_window.csv` (window SHA-256 recorded in `tests/scientific/test_planetary_context.py`; both windows reproduce the scored 7×7 grids exactly). Earth context surfaces are sampled live in the browser from AWS Terrain Tiles and are not cached. None of these enter F, U, C or P.

**Reviewed regeneration (2026-11-14).** Rationale strings were respaced and the dataset regenerated from cached inputs. Source observations and findings remain intact; maximum numeric difference versus the original MVP is 5.68e-14 (floating-point rounding). Current independent validation passes 63 Python tests. Planetary context extraction now verifies raster/window hashes; bundled NASA image renditions have their own integrity manifest.
