# TerrainX source verification

Verified on 2026-11-14 using official service responses and primary references. Data acquisition is independent of whether every candidate is scientifically useful. No newly screened site is field verified.

## NASA POWER: working requests and actual shape

Official documentation: https://power.larc.nasa.gov/docs/services/api/temporal/climatology/ . Regional climatology supports **one parameter per request**; point supports up to 20. The general documentation's regional example says 0.5 by 0.5 degrees, but the actual MERRA-2 precipitation response sampled here has **0.5 degree latitude by 0.625 degree longitude** spacing. Preserve the observed source grid, do not invent a 0.5-degree longitude lattice.

The following analyst-defined boxes are reproducible search windows, not official boundaries of the named environments. Actual responses yielded 130 points (25 + 35 + 35 + 35):

| Region | Latitude min,max | Longitude min,max | Actual returned cells |
|---|---|---|---|
| Western Saudi Arabia | 24, 26 | 38, 41 | 25 |
| Botswana dry basin | -22, -19 | 24.5, 27.5 | 35 |
| Northern Chile / Altiplano | -25, -22 | -70, -67 | 35 |
| Gobi region | 42, 45 | 101, 104 | 35 |

Example successful query:

`https://power.larc.nasa.gov/api/temporal/climatology/regional?latitude-min=24&latitude-max=26&longitude-min=38&longitude-max=41&parameters=PRECTOTCORR&community=AG&format=JSON`

Response members:

- `features[]`: point features; `geometry.coordinates` is `[longitude, latitude, elevation]`.
- `features[].properties.parameter.PRECTOTCORR`: JAN through DEC plus ANN.
- `parameters.PRECTOTCORR.units`: **mm/day**.
- `header.sources`: MERRA2; `header.fill_value`: -999.
- `header.start`: 20010101; `header.end`: 20251231. Returned message confirms January 2001–December 2025 precomputed climatology.

Use ANN only when valid, with approximate annual precipitation `365.25 * ANN`; this is a climatological proxy, not a field rain gauge or planetary precipitation metric. Preserve raw monthly values. Point metadata differs: the point response has `header.range`, a descriptive 25-year period string, rather than `header.start` and `header.end`.

Working point request (all six parameters supported):

`https://power.larc.nasa.gov/api/temporal/climatology/point?latitude=25&longitude=39.375&parameters=PRECTOTCORR,T2M,WS10M,ALLSKY_SFC_SW_DWN,PS,RH2M&community=AG&format=JSON`

Point data are `properties.parameter`, not `features[]`. Returned original units: PRECTOTCORR `mm/day`; T2M `C`; WS10M `m/s`; ALLSKY_SFC_SW_DWN **`MJ/m^2/day` for community AG**; PS `kPa`; RH2M `%`. Never label solar MJ/m²/day as kWh/m²/day without a 3.6 conversion. Solar source SYN1DEG is coarser than MERRA2. The point API is a coarse grid characterization at the requested location, not outcrop-scale meteorology.

Geographical context: NASA documents western Arabian lava fields [Khaybar](https://science.nasa.gov/earth/earth-observatory/white-and-black-volcanoes-of-saudi-arabia-152839/), Botswana's seasonal [Makgadikgadi salt pans](https://modis.gsfc.nasa.gov/gallery/individual.php?db_date=2026-02-05), and the Gobi in [southern Mongolia/northern China](https://science.nasa.gov/earth/earth-observatory/dust-storm-over-the-gobi-desert-79746/). A dry-basin search does not establish evaporites or carbonate at each coarse cell.

## Macrostrat v2

Official current guidance: https://dev.macrostrat.org/docs/data-services . Stable API v2 is the default; v3 is explicitly under development.

`https://macrostrat.org/api/geologic_units/map` without arguments returns its own accepted parameters and fields. Working location parameters are **`lat` and `lng`** in decimal degrees. Optional `scale` accepts small, medium, large. `format` supports json, csv, geojson, geojson_bare, topojson, topojson_bare.

Successful location query: `https://macrostrat.org/api/geologic_units/map?lat=37.54&lng=29.67`.

Response: `success.v=2`, `success.license=CC-BY 4.0`, `success.data[]`, and `success.refs` keyed by source_id. Map-unit fields include `map_id`, `source_id`, `name`, `lith`, `descrip`, `comments`, `scale`, `t_age`, `b_age`, `best_int_name`, and source-specific geological intervals. Map scale words are categorical coverage, not numeric map denominators unless obtained from source metadata.

The Salda test query returned small-scale ophiolite and tiny-scale intrusive geology, rather than local hydromagnesite shoreline deposits. NASA and field literature are required for the shoreline process claim. Mapped rock is not verified field mineralogy; absent, coarse or ambiguous maps must remain uncertain. A lithology string containing basalt supports a mapped basaltic unit only; it does not establish that an entire 24 km footprint is basalt or unconsolidated rover regolith.

## NASA GIBS: verified Web Mercator layer

Documentation: https://nasa-gibs.github.io/gibs-api-docs/access-basics/ . Capabilities fetched successfully from `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml`.

- Layer: `MODIS_Terra_CorrectedReflectance_TrueColor`.
- Tile matrix: **GoogleMapsCompatible_Level9**.
- CRS: EPSG:3857; tiles 256×256; levels 0 through 9.
- Format: image/jpeg; capabilities give `.jpeg` resource URLs.
- Date selected for reproducible interpretation: **2025-06-01**, inside the layer's declared daily availability interval.
- MapLibre template: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2025-06-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg`.
- A level 3, row 3, col 4 tile was fetched with HTTP 200 and image/jpeg. The tile and extracted layer/matrix XML are cached in `data/source/research/`.

Use attribution NASA GIBS / MODIS Terra and a functioning standard basemap. Tile delivery remains network dependent unless deliberately cached. True color supports geographical interpretation and cloud/land context; it does not independently measure mineralogy. Corrected reflectance imagery is not a DEM, and its visual sharpness does not change the 4 km terrain analysis grid.

## Challenge verification

The supplied [official 2026 challenge](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/) is indexed with the exact title, statement and four subjects provided by the user. An initial direct request produced a transient 502; the official search result and subsequent indexed page identify the challenge. The official [2026 home](https://www.spaceappschallenge.org/2026/) and [announcement](https://www.spaceappschallenge.org/blog/explore-the-next-frontier-at-the-2026-nasa-space-apps-challenge/) verify **The Next Frontier** and November 14–15, 2026. Event participation does not imply NASA approval of TerrainX or its model.

## Benchmark subsite evidence

All benchmark records are literature-supported references, never newly discovered sites. Coordinates are representative analysis anchors at the precision supported by each source; no coordinate is a permit, access route, safety assurance, or precise sampling recommendation.

1. **Lake Salda southeast shoreline**, 37.520408°N, 29.673456°E. A primary diatom study gives the hydromagnesite stromatolite sample location 37°31′13.47″N, 29°40′24.44″E: [Solak et al., archived primary paper](https://repository.ukim.mk/bitstream/20.500.12188/30852/1/2023%20-%20Solak%20et%20al.%20-%20Gomphonella%20saldanensis%20sp.%20nov.%20%20Bacillariophyceae%20%20from%20hydromagnesite%20stromatolites%20in%20Salda%20Lake%20%20Turkey.pdf). NASA describes the lake's shoreline hydromagnesite, microbialites, and relevance to Jezero's carbonate/lake interpretation in [Jez like Mars](https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/) and [Lake Salda Rocks](https://science.nasa.gov/photojournal/lake-salda-rocks/). Modern biological construction at Salda is a major limitation, not evidence of Martian life. A broad terrain window necessarily includes water and surrounding non-carbonate rock.

2. **Jabal Qidr, Harrat Khaybar**, 25.719714°N, 39.943981°E. The [Saudi Geological Survey's March 2024 scientific newsletter](https://sgs.gov.sa/storage/media/7268/MARCH-2024-Scientific-Newsletter.pdf) gives 25°43′10.97″N, 39°56′38.33″E for Jabal Qidr. [NASA's 2024 account](https://science.nasa.gov/earth/earth-observatory/white-and-black-volcanoes-of-saudi-arabia-152839/) specifically identifies Qidr's basaltic lavas and contrasts neighboring Abyad's rhyolite. The [Smithsonian GVP profile and subfeatures](https://volcano.si.edu/volcano.cfm?vn=231060&vtab=Subfeatures) independently identify the volcano at coarser 25°43′N, 39°57′E. A regional footprint has mixed volcanic lithologies; local material collection must be field verified.

3. **Craters of the Moon volcanic field, Idaho**, 43.42°N, -113.5°E. These are the [USGS volcanic-field profile's coordinates](https://www.usgs.gov/volcanoes/craters-of-the-moon-volcanic-field), which explicitly describes basaltic flows and cinder cones. The coordinate precision is regional. Do not substitute the NPS entrance coordinate and imply that it is a sampled lava unit. Weathered terrestrial lava and vegetated surfaces do not reproduce lunar regolith, vacuum, or gravity.

4. **Yungay subsurface clay reference, Atacama**, -24.084800°N, -69.915069°E. A primary [2020 study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7645800/) locates its first pit at 24°5′5.28″S, 69°54′54.25″W. It documents illite–smectite and other salts/minerals, including calcite, in inhabited subsurface soils. This supports a partial Mars sampling/mineral-preservation experiment hypothesis, not a Jezero delta or direct lake-carbonate equivalence. Hyperaridity does not imply sterility; documented subsurface water and biology must remain in the reality gap.

## Planetary mission references

- [NASA Lunar Volcanism](https://science.nasa.gov/moon/lunar-volcanism/): volcanic history and lunar mare context.
- [NASA Wrinkle Ridge in Mare Crisium](https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/): basaltic mare plain, lava flooding, contractional ridges; supports basalt sampling and surface operations, not a specific safe traverse.
- NASA Jezero/Salda references above support sedimentary/lacustrine/carbonate preservation questions; no modern terrestrial lake reproduces the current Martian environment.

Raw response URLs, local cache timestamps, SHA-256 checksums and file paths are recorded in `data/source/research/retrieval_manifest.json`.
