# Maps, imagery and terrain visualization

## Atlas layers

The Discovery atlas uses MapLibre with Esri Dark Gray, Esri World Imagery, dated NASA GIBS true colour and Blue Marble relief. Layers identify their source, date and supported zoom. Local Natural Earth geography supplies a fallback when providers are unavailable.

NASA daily imagery supports the verified MODIS Terra/Aqua and VIIRS SNPP products. Not every product/date has imagery. AWS Terrain Tiles provide optional 3D terrain and hillshade; the globe projection supports global context. These layers are visual context and do not enter scientific scores.

The atlas displays study-region bounds, persistent candidate/benchmark markers, the selected POWER cell and the actual 24 km SRTM analysis footprint with 49 sample positions. Attribution remains visible. Candidate search, keyboard navigation and status-aware sorting accompany the map.

## Terrain viewer

Analog DNA compares the exact cached Earth and planetary 7×7 analysis grids at the same horizontal scale. A separate 96 km regional context view uses real MOLA/LOLA native windows and live AWS Earth terrain, falling back to the analysis lattice offline. Vertical exaggeration is labeled; absolute elevations across worlds are not directly comparable.

Source manifests enforce full-raster and extracted-window hashes. Timeouts and no-data checks preserve unavailable states rather than manufacturing elevations. [SOURCE_RESEARCH.md](SOURCE_RESEARCH.md) and [TERRAIN_PILOT.md](TERRAIN_PILOT.md) document the scientific products.

## Presentation assets

The landing globe uses real geographic boundaries and dataset candidate points. Reduced motion stops rotation. NASA comparison images are bundled unchanged with source URLs, attributions and SHA-256 metadata in `frontend/public/nasa/imagery-manifest.json`.
