# Expanded cell search and polar model — reproducibility

Current contracts: terrainx-cell-search-v3, terrainx-field-sites-v1 and terrainx-lunar-polar-v2. They are separate from the original16-candidate discovery and do not overwrite its scores. All are pinned in immutable science releases; unavailable historical files never fall back to newest observations.

## Reproduce under D:\TerrainX

```powershell
.venv\Scripts\python.exe scripts\build_planetary_profiles.py
.venv\Scripts\python.exe scripts\import_browser_cache.py data\source\acquisition\terrainx-cells-srtm.json data\source\acquisition\terrainx-cells-macrostrat.json data\source\acquisition\terrainx-cells-power-gbif.json
.venv\Scripts\python.exe scripts\verify_diviner_source.py
.venv\Scripts\python.exe scripts\build_cell_search.py
.venv\Scripts\python.exe scripts\build_lunar_polar.py
.venv\Scripts\python.exe scripts\validate_results.py
npm run test:unit
npm run build
```

Successful source JSON caches are already committed; browser bundle import re-hashes original bodies. Verify the command's accepted bundle files before refreshing; full Diviner and planetary sources are ignored and downloaded only during preprocessing. The Diviner verifier uses resumable8MB ranges, checks the PDS manifest MD5/full SHA256 and verifies every retained record against the independent source. The604.8MB source is not sent to judges.

Cell search uses the same numerical/core geology/utility functions as the released discovery, with actual point climatology for every cell. All130 receive terrain;129 have mapped context. Geology and coverage gate P; approximate land eligibility is respected. Deterministic shortlists use4 per region and65km separation. Actual results:79 eligible Mars cells,13 Mars picks (12 new vs aridity),1 Moon mapped-basalt lead at23°S70°W. These are bounded-sample hypotheses, not validated new analogs.

Public climate observations retain units, period, retrieval and source-response hashes. Soil wetness, climatological temperature span, column AOD, inverse GBIF reporting density and coarse slope percentiles are descriptive Earth comparisons, not increased planetary equivalence. Keyword host-rock context is not a cave inventory.

The field-site file contains genuine full characterizations for the130 cells, using existing deterministic experiment templates explicitly labeled proposals. It is consumed only by the Field Study Builder; original discovery counts remain16 +4 references. Shared field links request their source release; saved models are used for study scores. Full JSON is the complete exchange format; compact QR has narrower scope.

Polar LOLA extraction uses validated PDS labels/raster hash at eight IAU feature centres. The associated NASA region list is dated October2024; centres are not landing polygons. Diviner PRP records are selected within12.5km by triangle centroid. Actual3D facet areas weight thermal/stability fractions; boundary facets are not clipped. Temperature medians are per triangle. Model ice depth0 means modeled surface stability; positive depths through2.8738m are modeled depth;−999 means beyond the model depth; other negative codes are unknown. No ice detection or resource abundance follows. Undefined code area and missing thermal area are visible.

Unchanged reruns preserve cell/polar bytes and audit timestamps through stable_science_json. Numeric or provenance changes create a new release. Keep every historical release untouched. Broader common-support coverage, global search, polar illumination engineering and field validation remain separate research.
