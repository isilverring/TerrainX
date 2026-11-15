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

## Comparison imagery and physical constants

| Item | Use | Source |
|---|---|---|
| NASA Earth Observatory, *Jez Like Mars* | Lake Salda (Landsat 8 OLI, 8 June 2020; NASA EO / Lauren Dauphin, USGS Landsat) and Jezero CTX mosaic (NASA/JPL-Caltech/MSSS/Tanya Harrison) in Compare Worlds; carbonate/delta comparison | [page](https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/) |
| NASA Earth Observatory, *White and Black Volcanoes of Saudi Arabia* | Harrat Khaybar / Jabal Qidr (Landsat 9 OLI-2, 25 April 2024; NASA EO / Lauren Dauphin, USGS Landsat) | [page](https://science.nasa.gov/earth/earth-observatory/white-and-black-volcanoes-of-saudi-arabia-152839) |
| NASA Science, *Wrinkle Ridge in Mare Crisium* | Mare Crisium image (NASA/GSFC/Arizona State University; instrument and scale not stated on the page) | [page](https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/) |
| Gravity constants | 9.80665 m/s² (standard gravity), 3.71 (Mars), 1.62 (Moon) — declared values in `physics.ts` | — |
| Mars atmosphere scenario | 600 Pa, 210 K, R=188.9 J/(kg·K): illustrative assumption, labelled SCENARIO, not a Jezero measurement | — |
| NASA POWER PS, T2M, WS10M | Earth air density and dynamic pressure; units read from the dataset (`kPa`, `C`, `m/s`) | same POWER responses as above |

## Research Lab reference products

The source-scoped registry is `frontend/public/data/challenge_evidence.json`. It retains coordinates, methods, quantities, source links and applicability limits for nine records. These records do not become measurements at other sites.

- Salda mineral phases and water/diatom observations: [hydromagnesite precipitation study](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2025JE009627), [published diatom study](https://doi.org/10.1080/0269249X.2023.2233519).
- Yungay mineralogy, humidity and biological assays: [inhabited subsurface wet smectites](https://pmc.ncbi.nlm.nih.gov/articles/PMC7645800/).
- Cave inventories: [NPS Craters caves](https://www.nps.gov/thingstodo/craters-caves.htm), [USDA Lava River Cave](https://www.fs.usda.gov/r03/coconino/recreation/lava-river-cave).
- Permafrost references: [GTN-P Janssonhaugen P10](https://data.gtn-p.org/api/pt/501), [Norwegian Polar Institute monitoring](https://mosj.no/en/indikator/climate/land/permafrost/).
- LCROSS evidence: [water in the ejecta plume](https://doi.org/10.1126/science.1186986), [impact location](https://ntrs.nasa.gov/citations/20140005563), [volatile and dust hazards](https://ntrs.nasa.gov/api/citations/20250006445/downloads/SMD-LUN-102_RevA_authors.pdf).

Lunar illumination uses verified JPL kernels listed in `data/source/illumination/kernels.json` and cached Horizons comparisons in `horizons_checks.json`. The 2025 POWER daily profiles and Copernicus route lattices retain source metadata. Model support and limitations: [Research Lab methods](docs/PARTIALS_IMPLEMENTATION.md).

NASA comparison images are bundled unchanged with source URLs, attribution and integrity metadata in `frontend/public/nasa/imagery-manifest.json`; source links remain available alongside the images. Imagery is never used for scoring or to assert mineralogy.

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

## Additional reference resources

The review bundled four unmodified NASA display renditions for audience reliability: Salda, Jezero CTX, Khaybar and the Crisium ridge. Source/credit/retrieval time/byte count/SHA-256 are in `frontend/public/nasa/imagery-manifest.json`; `scripts/cache_worlds_images.py` reproduces the cache. These images never enter scoring. Full uncropped side-by-side is the default; the optional split view crops display frames and does not co-register the images. Planetary context preprocessing now enforces original raster and native-window hashes. The original user logo is preserved in `docs/design/logo-original.jpg`; it is branding, not scientific imagery.

NASA GIBS/Worldview access, NASA PDS LRO LOLA/Diviner and ESA Copernicus DEM are now used with explicit product semantics. CSA RADARSAT, ESA Sentinel/SAR and JAXA sources remain optional and are not claimed as integrated observations.

## Copernicus partner DSM — separate pilot
Three actual GLO90 AWS2021 COG tiles, EDM/FLM/WBM masks and source XML/licences are cached and checksum-verified. This is an EU/ESA/DLR/Airbus partner source, not NASA SRTM or visualization-only Terrarium. DSM includes water-surface editing and may contain SRTM fills. Per-tile provenance: data/source/pilot/manifest.json. Processing and licence attribution: docs/TERRAIN_PILOT.md.

## Audited expanded sources

- NASA POWER point climate/environment: all130 cells, actual API metadata retained. AOD550 is column aerosol extinction, not a dust-specific measurement; GWET is modeled relative soil wetness. See each cell's source details.
- [GBIF occurrence API](https://techdocs.gbif.org/en/openapi/v1/occurrence): bounding-box counts, query URL/hash/retrieval preserved. Reporting density is sampling-dependent; no inference of life scarcity or habitability. Underlying contributing datasets retain their own attribution/licences.
- [LRO Diviner derived PRP archive](https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/): PDS label-validated fixed-width thermal/ice-stability model records. Independent full-source digest and published MD5 proof under data/source/diviner/verification.json; scripts/verify_diviner_source.py reproduces acquisition. No detection of water ice claimed.
- [NASA's October28,2024 region announcement](https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/) and [IAU Gazetteer](https://planetarynames.wr.usgs.gov/): dated feature context/centres, not current landing commitments or landing polygons.

The app includes source-reported, derived and modeled quantities with distinct limits. Source acquisition and scientific pipeline use no paid key or LLM endpoint.

**AI acknowledgement for data.** The acquisition, verification and processing scripts that produce every derived data product were generated and edited with AI coding assistants (OpenAI Codex, Anthropic Claude) under team review. AI also helped curate the literature evidence records from cited publications. Source observations themselves are unchanged and hash-recorded. No AI model creates, estimates or alters a value. See [AI_DISCLOSURE.md](AI_DISCLOSURE.md).

## Literature and expanded-study sources

The expanded common-support study uses33 verified GLO90 tiles for18 selected sites,132 DEM/mask rasters and201 source/licence objects. Source contracts, acquisition periods, masks, licences and hashes: data/source/pilot/manifest.expanded.json and validation.expanded.json; methods: docs/TERRAIN_PILOT.md. Original two-site sources and frozen outputs remain unchanged.

Scoped case observations: Oliveros et al. (2007), Table1a,p212, [primary paper](https://www.andeangeology.cl/index.php/revista1/article/download/V34n2-a03/490), [DOI](https://doi.org/10.5027/andgeoV34n2-a03); Franchi et al. (2022), Table1, [DOI](https://doi.org/10.3389/fevo.2022.818417); Schmidt et al. (2023), [DOI](https://doi.org/10.3389/fspas.2023.1108386). Reported coordinates/materials, source scope, source datum uncertainty and derived distances remain distinct. Source SHA identifies the curated extraction file, not an entire publication. No field verification or original NASA mineralogical measurement is claimed.
