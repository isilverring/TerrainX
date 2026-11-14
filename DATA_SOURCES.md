# Data sources and attribution

| Actual source | Use | Source documentation |
|---|---|---|
| NASA POWER/MERRA-2/CERES |Regional precipitation and 20 point profiles; actual 2001–2025 period and original units preserved|[NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/)|
| NASA SRTM via OpenTopoData |20 grids,49 samples each,4 km spacing;≈90 m native source is not analysis spacing|[SRTM](https://www.opentopodata.org/datasets/srtm/), [API](https://www.opentopodata.org/api/)|
| NASA MGS MOLA MEGDR16 |Real Jezero broad terrain; validated PDS labels, meters, big-endian|[Dataset](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html), [exact product directory](https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/)|
| NASA LRO LOLA LDEM16 |Real Mare Crisium broad terrain; little-endian, DN×0.5 m|[Product description](https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Lunar%20Reconnaissance%20Orbiter%20(LRO)/LOLA/GDR/GDRDEM.htm), [directory](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/)|
| NASA GIBS MODIS Terra true color |Verified EPSG:3857 WMTS, GoogleMapsCompatible_Level9,256px JPEG,2025-06-01; imagery alone does not establish mineralogy|[NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/access-basics/)|
| Macrostrat |Mapped units at 19/20 locations; CC-BY4.0; original map citations, scales and IDs preserved|[Data services](https://dev.macrostrat.org/docs/data-services)|
| Natural Earth 110m land |Public-domain broad land mask and decorative globe; not terrain/mineralogy|[Source](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson)|
| Esri World Dark Gray Base/Reference |Verified public Earth basemap; attribution Esri, HERE, Garmin, OpenStreetMap contributors, GIS user community; local Natural Earth coastlines underlay|[Service metadata](https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer)|
| Esri World Imagery |Optional satellite basemap (mixed-date mosaic, native zoom ≤17); interpretation only|[Service metadata](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer)|
| NASA GIBS daily corrected reflectance |Optional dated basemap: `MODIS_Terra_…` (from 2000-02-24), `MODIS_Aqua_…` (from 2002-07-04), `VIIRS_SNPP_CorrectedReflectance_TrueColor` (from 2015-11-24); EPSG:3857 `GoogleMapsCompatible_Level9`, max z9. Dates without imagery return HTTP 404 and are reported in the UI. Checked 2026-11-14: VIIRS SNPP returned no tiles after 2026-11-02; NOAA-20 had gaps and is not offered|[GIBS access basics](https://nasa-gibs.github.io/gibs-api-docs/access-basics/)|
| NASA Blue Marble (GIBS) |`BlueMarble_ShadedRelief_Bathymetry`, Aug 2004, `GoogleMapsCompatible_Level8`; optional relief basemap|[NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/)|
| AWS Terrain Tiles (terrarium) |**Visualisation only:** map 3D terrain/hillshade and the live 96 km Earth context surface in the 3D viewer (z8, ~0.5 km px). Composite of SRTM, GMTED2010, ETOPO1 and others. Never used for F, U, C or P|[Registry of Open Data](https://registry.opendata.aws/terrain-tiles/)|
| MOLA/LOLA native context windows |**Visualisation only:** 31×33 (MOLA, Jezero) and 57×59 (LOLA, Crisium) native DN windows, cut on the PDS origin after whole-raster SHA-256 matched `manifest.json`; resampled to 49×49 at 2 km by `scripts/build_planetary_context.py`|Same PDS products as above|

No API key, paid service or judge-time NASA query is required. External map tiles/source links still need internet. The original CARTO endpoint returned key-required watermark tiles and was replaced after visual QA; it is not the shipped basemap.

## Benchmark subsites and mission evidence

Coordinates, source scopes, citations and limitations are in `reference_evidence.json` and `docs/SOURCE_RESEARCH.md`.

- **Salda shoreline 37.520408N,29.673456E:** published hydromagnesite-stromatolite sample point; [NASA Jezero/Salda](https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/). Water and biology differ from present Mars; regional footprint includes lake and ophiolitic rocks.
- **Jabal Qidr 25.719714N,39.943981E:** Saudi Geological Survey coordinate; [NASA white/black volcanoes](https://science.nasa.gov/earth/earth-observatory/white-and-black-volcanoes-of-saudi-arabia-152839/). Neighboring Khaybar units include felsic volcanics; the field is not uniformly basalt.
- **Craters of the Moon 43.42N,113.5W:**[USGS regional coordinate/basalt context](https://www.usgs.gov/volcanoes/craters-of-the-moon-volcanic-field); not a surveyed sampling outcrop.
- **Yungay 24.0848S,69.915069W:**[published first pit in inhabited wet subsurface clay](https://pmc.ncbi.nlm.nih.gov/articles/PMC7645800/). Partial Mars sampling/mineral-preservation relevance; aridity does not mean sterility or prove a Jezero delta.
- [NASA lunar volcanism](https://science.nasa.gov/moon/lunar-volcanism/) and [Wrinkle Ridge in Mare Crisium](https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/) support the lunar mission.

## Provenance and licensing

`data/cached/` contains successful raw JSON payloads with exact URL, retrieval UTC timestamp and original HTTP-body SHA256. Payloads are parsed/serialized JSON, not byte-for-byte HTTP wire captures. Original 33MB planetary rasters are local and Git-ignored; labels, checksums, file sizes and exact native pixels used for extraction are committed. A fresh clone re-downloads rasters with the planetary script. `provenance.json` indexes cached Earth requests.

Observations retain original units, coordinates, period, native resolution, missing values and source metadata. Terrain profiles retain native support, lattice, footprint, resampling and source references. Generation timestamps do not replace source retrieval times. NASA source-team publications and source-specific terms apply; NASA does not endorse this app. Macrostrat is CC-BY4.0 and original map citations are shown. Natural Earth is public domain. Basemap/GIBS attribution is visible. Generated design images are mockups only, never scientific layers. The Passport QR code is generated offline with `qrcode-generator` (MIT).

## Optional resources supplied by the user

Earthdata Search, Worldview, LRO/Diviner, CSA RCM/RADARSAT-1, Copernicus Data Space, ESA Open Science Catalog and JAXA G-Portal are recorded as possible extensions. **No measurements from these optional sources are claimed in this release.** Diviner could support a later properly matched lunar thermal study; SAR could support separately validated surface/ice-context analysis. Neither should be added as an unverified score.
