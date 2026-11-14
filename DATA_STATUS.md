# Current scientific data status

Science release **science-b1a132b201ad2046**. Original dataset SHA256 **3515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c**. Historical release folders remain immutable. Core scientific validation:81 Python tests plus independent reproduction;89 TypeScript tests;38 production-preview workflows. See DEPLOYMENT.md for exact public publication.

| Analysis | Actual available data | Interpretation |
|---|---|---|
| Original discovery |130 real POWER regional cells;16 automatic candidates;4 benchmarks;20 climate/SRTM profiles;19 mapped geology contexts |10 automatic entries support preliminary default-model hypotheses. Benchmarks never count as new discoveries. |
| Expanded cell search v3 |130 point climates,130 SRTM7×7 grids,129 mapped geology contexts,130 environmental climatologies and130 GBIF count queries |79 Mars/1Moon rankable cells. Mars shortlist13,12 new vs original; Moon mapped-basalt lead needs verification. Original scores unchanged. |
| Field proposals |130 genuine cell characterizations plus original reference benchmarks |Proposed stations/protocols. No field measurements or access approval implied. |
| Primary planetary profiles |Real MOLA Jezero and LOLA Mare Crisium7×7 grids |4km spacing/8km slope baseline; unequal native support is explicit. |
| Common-support pilot |2 Earth sites ×2 targets ×10 support/offset choices =40 comparisons |Actual Copernicus DSM/masks and PDS rasters;8/12km aggregation supports; no original ranking replacement. |
| Lunar polar reference v2 |8 real LOLA feature-centre profiles;30,674 retained Diviner triangles |Model-derived thermal and sublimation-stability quantities, area weighted. Not current landing polygons, detected ice or a base-selection certification. |

Independent Diviner verification downloaded604,800,210 bytes, checked2,880,000 records and matched published PDS MD5 **80cdfe83592a3419c74b1b55b636711e** and teammate SHA256. Every retained record matches verbatim. Proof: data/source/diviner/verification.json. Full tabular source,45MB manifest and ranged chunks are ignored and reproducibly downloadable.

All numeric climate observations retain original units, source URL, actual period, response hash, retrieval time and coordinates. POWER meteorological support is0.5°×0.625° (solar1°×1°), climatology2001–2025; not outcrop measurements. Annual precipitation proxy requires mm/day. Monthly mean daily maxima/minima are not absolute extremes. GWET is model wetness, AOD550 column aerosol extinction and GBIF a reporting count; none establishes ice, dust composition, sterility or habitability.

SRTM nominal90m input is sampled at4km over24km; coarse slopes cannot identify boulders or certify safety. The Natural Earth110m land mask is approximate. Mapped units do not confirm subsite mineralogy or cave presence. Diviner medians count triangles equally; fractions use their3D surface areas, selected by centroid without clipping boundary triangles. Undefined negative ice-depth codes remain unknown.

No source-acquisition errors are recorded in original or expanded datasets. Cached raw JSON bodies and source records are preserved. Full33MB planetary rasters and dense pilot TIFFs are ignored; labels/checksums/derived arrays are committed. See SCIENCE.md, DATA_SOURCES.md and docs/CELL_SEARCH_AND_POLAR.md for methods and reproduction.
