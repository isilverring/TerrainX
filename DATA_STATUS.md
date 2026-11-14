# Scientific data status

Acquisition is running. Verified regional responses contain130 real grid cells (25Saudi,35Botswana,35Chile,35Gobi). Point characterization is being written atomically to `data/derived/candidates.json`; intermediate output is not the final dataset.

Both MOLA and LOLA rasters are available and validated. Extracted49-point target grids are in `planetary_targets.json`. Native source pixels, labels, checksums and acquisition metadata are under `data/source/planetary/`. Original33MB rasters remain local and are reproducibly downloadable.

POWER precipitation units are mm/day; annual proxy is365.25×daily. Actual meteorological grid is0.5°×0.625°,2001–2025. Solar flux under AG is MJ/m²/day. Coarse grid climatology is not an outcrop instrument measurement.

Required sources: NASA POWER regional and point climatology, NASA SRTM via OpenTopoData, MOLA, LOLA, NASA GIBS, NASA mission references, and Macrostrat.

All availability claims and counts will be replaced with verified pipeline outputs. Missing planetary measurements must produce null physical fidelity.
