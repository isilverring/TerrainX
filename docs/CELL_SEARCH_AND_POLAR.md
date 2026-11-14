# 130-cell mission-aware search and lunar south-polar module

Two separate, versioned experiments added on the laptop (checkpoints L7–L9). Neither changes the released discovery (`dataset.json`, aridity-ranked shortlist, scores). Both ship in science release `science-1407d3729d4bd714`; older releases stay frozen.

## Data acquisition (genuine, checksum-tracked)

The cloud build workspace cannot reach OpenTopoData, Macrostrat or NASA PDS, so the laptop's built-in browser fetched the data:

| Source | Requests | How integrity is kept |
|---|---|---|
| OpenTopoData `srtm90m` (NASA SRTM) | 114 (7×7 grid per cell) | Request URLs rebuilt in the browser and proven byte-identical to the pipeline's cache keys (SHA-256 of the URL list `ab65b23bfd4f…22bc`). Raw bodies + SHA-256 of the exact bytes saved in `data/source/acquisition/terrainx-cells-srtm.json`. |
| Macrostrat `geologic_units/map` | 114 | Same; `data/source/acquisition/terrainx-cells-macrostrat.json`. |
| NASA PDS LOLA `ldem_16.img` | 1 file, 33,177,600 bytes | Must match the SHA-256 pinned in `data/source/planetary/manifest.json` (`a511e40d7a3e…54cb`); `build_lunar_polar.py` refuses to run otherwise. Re-extracting Mare Crisium with it reproduces the released grid exactly. |
| IAU Gazetteer of Planetary Nomenclature | 2 searches (lat −90…−80) | Feature IDs, centres and diameters recorded in `scripts/build_lunar_polar.py` with Gazetteer links. |

`scripts/import_browser_cache.py` re-hashes every body and writes standard CachedHTTP records (`data/cached/`, keyed by SHA-256 of the URL), so the unmodified pipeline functions run offline.

## Reproduce

```bash
python scripts/import_browser_cache.py data/source/acquisition/terrainx-cells-srtm.json data/source/acquisition/terrainx-cells-macrostrat.json
python scripts/build_cell_search.py          # offline from cache; --online to fetch missing entries
python scripts/build_lunar_polar.py          # needs data/source/planetary/ldem_16.img (git-ignored, 33 MB)
python -m pytest tests/scientific/test_cell_search_polar.py
```

## Cell search (`terrainx-cell-search-v1`)

- Every one of the 130 screened NASA POWER cells is characterized with the pipeline's own `sample_grid`, `terrain_metrics`, `fetch_geology`/`classify_geology`, `mission_utility`, `physical_fidelity` and `combined_priority`. F reproduces every released candidate exactly.
- Point T2M climatology was not acquired for cells, so the temperature criterion is missing for all cells (coverage ≤ 95%), applied equally and never counted as zero. P therefore differs slightly from released candidates' P.
- Shortlists use the released rules (4 per region, 65 km separation) but sort by P instead of aridity.
- Results (release `science-1407…`): terrain 130/130, mapped geology 129/130. Mars: 79 rankable cells; mission-aware shortlist 13 (Chile has 1 eligible cell), 11 new vs the aridity shortlist. Moon: 1 rankable cell — 23.0°S 70.0°W, Macrostrat "Triassic–Jurassic Basaltic" (source 1087), F 66.4, P 75.6. A mapped regional unit, not field-confirmed basalt.

## Lunar south pole (`terrainx-lunar-polar-v1`)

- LOLA 7×7, 4 km grids (same extraction as Mare Crisium) at the IAU centres of Cabeus B, Haworth, Mons Malapert, Mons Mouton, Nobile, de Gerlache and Slater — the features naming NASA's nine Artemis III candidate regions (NASA news release, 2024-10-28) — plus Shackleton as a reference. These centres are not NASA's landing-region polygons.
- Earth terrain twins compare relief shape (F) against all 134 Earth profiles (130 cells + 4 references). Strongest: Cabeus B (F 97), Mons Mouton (F 91). Weakest: Mons Malapert (F 1), Shackleton (F 0) — no close relief in the four study regions.
- Terrain twins say nothing about polar illumination, permanently shadowed cold traps, volatiles, vacuum, 1.62 m/s² gravity or regolith.
