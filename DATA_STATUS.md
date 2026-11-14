# Scientific data status

Acquisition complete with no errors. Verified regional responses contain130 real grid cells (25Saudi,35Botswana,35Chile,35Gobi). Deterministic search selected16 automatic candidates. All16 plus4 separately labelled benchmarks have real POWER point and SRTM terrain profiles. Macrostrat returned mapped units for19 of20 locations. Ten automatic candidates have enough mapped evidence for a preliminary mission-specific hypothesis; none is field-validated.

The deployable release is `data/derived/dataset.json`, copied to `frontend/public/data/dataset.json`. Successful raw JSON payloads and retrieval records are versioned in `data/cached/`. Derived annual precipitation, seasonal range, terrain metrics and F/U/C preserve links to their source observations.

Both MOLA and LOLA rasters are available and validated. Extracted49-point target grids are in `planetary_targets.json`. Native source pixels, labels, checksums and acquisition metadata are under `data/source/planetary/`. Original33MB rasters remain local and are reproducibly downloadable.

POWER precipitation units are mm/day; annual proxy is365.25×daily. Actual meteorological grid is0.5°×0.625°,2001–2025. Solar flux under AG is MJ/m²/day. Coarse grid climatology is not an outcrop instrument measurement.

Required sources: NASA POWER regional and point climatology, NASA SRTM via OpenTopoData, MOLA, LOLA, NASA GIBS, NASA mission references, and Macrostrat.

Benchmark subsite evidence takes precedence over broad regional lithology. In particular, the Salda hydromagnesite shoreline benchmark cannot gain lunar basalt relevance from a coarse ophiolite map polygon. Unknown remains null.

The search applies a broad Natural Earth110m land mask before shortlist selection. All130 precipitation cells remain in the GeoJSON; coast/water-screened centers are not silently removed from the research record. The mask is not field-scale coastline validation.
