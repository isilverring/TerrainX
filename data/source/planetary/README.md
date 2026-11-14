# Validated planetary sources

`scripts/build_planetary_profiles.py` downloads the original 16-pixel/degree products and validates their detached PDS3 and PDS4 labels before extracting real grids. It never substitutes a synthetic raster on failure.

## MOLA

- Source: https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megt90n000eb.img
- Label: matching `.lbl` and `.xml` in the same directory; `megt90n000eb.hdr` corroborates geometry.
- 2880 lines by 5760 samples, signed 16-bit **big endian**, detached data offset zero.
- Each DN is topography in meters relative to the GMM3 areoid; no vertical offset is added.
- Label uses a 3,396,000 m spherical map model. The native latitude pixel size calculated from that label is 3704.461337 m. The actual east-west physical pixel size is smaller by cos(latitude).
- The 2026 PDS4 label explicitly corrects previously swapped pixel scale and pixel resolution metadata. Current PDS4 cartography and pixel-center registration are validated.
- MOLA's source-team interpolation fills bins without shots. The gridded map is not a uniform set of direct laser shots. The official description notes track gaps up to 12 km.
- No special missing-data constant is defined in the authoritative PDS labels. The supplementary ENVI header contains `data ignore value = 0`; this is not used to delete legitimate zero topography. These target native samples are negative, and none is zero. Extraction rejects values outside the label's stated global extrema.

## LOLA

- Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_16.img
- Matching `.lbl` and `.xml`; `dsmap.cat` is from the source volume's `catalog/` directory.
- 2880 lines by 5760 samples, signed 16-bit **little endian**, detached data offset zero.
- **Height = DN × 0.5 meters.** Adding 1,737,400 m would compute planetary radius, not the terrain height required here.
- Native latitude pixel size is approximately 1895.209402 m, derived from its 1,737,400 m reference sphere.
- LOLA's DSMAP catalog explicitly describes a one-pixel revision in its PDS3 projection-offset convention relative to older Mars DEM descriptions. A shared unqualified PDS3-offset equation would therefore be wrong. The implementation uses validated global bounds and center registration: zero-based col center `(col + 0.5)/16` longitude, row center `90 - (row + 0.5)/16` latitude.
- These are binned, interpolated altimetric grids. They do not resolve fine regolith mechanics or rover-scale hazards.

## Common analysis grid

Each target has a 7×7 lattice at 4 km spacing, spanning 24×24 km between outer sample centers. Local east/north offsets are mapped using an inverse spherical azimuthal-equidistant formula with the radius from that product's label. Bilinear interpolation uses four real native pixel-center values for each lattice point; it does not invent a replacement physical observation.

The `*-native-samples.json` files preserve all actual integer pixels used, their zero-based indices and center coordinates, plus source URLs/checksums. Large original rasters are ignored by Git but retained in the local download cache. Re-running the script downloads them if absent. `manifest.json` records byte lengths, SHA-256 checksums and local retrieval timestamps.

Matching sample spacing does **not** make Earth, Moon and Mars effective resolutions identical. This product enables an explicitly exploratory broad-scale comparison, with unequal-resolution and interpolation warnings. Absolute elevations reference different surfaces and must never be compared across bodies.
