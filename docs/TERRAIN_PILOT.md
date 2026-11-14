# Common-support terrain pilot

This is a separate experimental result, not a replacement for the original discovery scores. Run `.venv\Scripts\python.exe scripts\build_terrain_pilot.py` after `build_planetary_profiles.py`. Missing public Copernicus assets download from the acquisition manifest and must match committed lengths and SHA256 hashes. Full TIFF/IMG rasters remain locally cached and ignored; source labels, licences, hashes and the reproducible derived grids are committed.

## Actual inputs

- Earth: Copernicus GLO90 DSM, AWS 2021 COG release, three tiles covering the automatic Saudi24.000N39.375E candidate and reference Lake Salda shoreline37.520408N29.673456E. 1200×1200 Float32,3arcsec, RasterPixelIsPoint. GDAL's actual half-pixel-adjusted transform is used. Source XML validates EGM2008/metres and EPSG4326. Original product XML describes1201-pixel tiles; the documented AWS conversion removes shared south/east edges. TanDEM-X source dates are2011–2014 for these tiles; fills can have other epochs.
- Mars/Moon: checksum-verified actual PDS MOLA MEGDR16ppd and LOLA LDEM_16 rasters and corresponding validated labels. Pixel-center registration, byte order, scale, planetary radius, valid DN range and height datum come from the labels. Native north–south pixels are about3.7km on Mars and1.9km on the Moon.
- EDM/FLM/WBM masks: raster nodata/nonfinite/voids excluded; no invented zero-height nodata. Unknown mask codes fail processing. Water, edited and filled area fractions are reported. Some fills contain SRTM: the Earth products are not fully independent. DSM includes vegetation/buildings. Lake pixels describe water surface, never bathymetry.

Sources: [Copernicus collection and obligations](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM), [AWS registry](https://registry.opendata.aws/copernicus-dem/), [COG conversion](https://copernicus-dem-90m.s3.amazonaws.com/readme.html), [DOI](https://doi.org/10.5270/ESA-c5d3d65). Complete per-tile source URLs, acquisition timestamps, XML and licence hashes are in data/source/pilot/manifest.json and the downloadable pilot JSON.

## Processing contract

Each source is reprojected by GDAL area-weighted averaging to its own spherical local azimuthal-equidistant working grid,48km wide,1km cells. Earth uses6371000m; each planet uses its label radius. No new instrument observations are created by oversampling planetary pixels. Then8km or12km square means are computed at the same7×7,4km-spaced centers. Coverage weights retain missing-area effects; boxes need90% valid area. Native planetary spacing must be at most half the averaging width. Metrics use24km center footprints,8km slope baselines and32/36km contributing widths.

This is approximate common aggregation support, not calibrated instrument point-spread equivalence. The Earth map is WGS84 geodetic but the local working geometry is spherical; this approximation, source interpolation, vertical errors, editing and differing epochs remain limitations. Absolute elevations on incompatible datums never enter F.

Four illustrative fidelity tolerances:3° median slope,5° p90 slope,150m relief,75m detrended RMS. Same-source Copernicus bilinear point sampling provides a baseline separate from source substitution. No U/C/P score changes. Ten combinations per site/target: two averaging widths × original/east/west/north/south centers. Both Earth and target shift4km together. This does not exhaust independent offset choices. Center runs repeat on500m calculation cells to check numerical convergence.

## Actual results

| Pair | Original SRTM F | Copernicus point F | 8km center F | 12km center F | Range over10 scenarios |
|---|---:|---:|---:|---:|---:|
| Saudi / Jezero |94.7|94.7|89.2|85.5|74.0–97.2|
| Saudi / Mare Crisium |43.0|42.9|53.5|61.7|41.9–68.2|
| Salda / Jezero |80.4|80.5|86.4|83.7|79.3–98.9|
| Salda / Mare Crisium |34.9|34.9|47.4|56.0|42.4–66.2|

All40 scenarios have sufficient source coverage. Maximum center numerical-check difference is0.002316 F points. Mean water-surface fraction across overlapping Salda boxes is about5.7%; Saudi external fill is about1.8–1.9%. These are mask-derived processing summaries, not field observations or unique-area surveys.

Window placement materially changes interpretation. Tiny quadrature differences do not imply small measurement uncertainty. No discovery winner or new geological match follows. Validation recomputes all shipped features and scores; synthetic flat/plane/missing-support fixtures occur only in tests.

Produced using Copernicus WorldDEM-90 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
