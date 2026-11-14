# TerrainX recovery checkpoint

Release 3 code and science are complete and pushed to private https://github.com/isilverring/TerrainX, main. All work remains **D:\TerrainX**. Public release packaging/publication is the current step; check DEPLOYMENT.md for the exact deployed source rather than assuming the latest GitHub commit is live.

## Verified implementation

- M1 c52fb8d: immutable science releases; Research snapshots save/export/import exact models and candidate context. Links pin release/hash/model and refuse unavailable historical inputs.
- M2 04d38fd: click-through Evidence Inspector, spatial support schematic and source-scoped Saudi/Chile/Salda cases.
- M3 1cd1ccb: Discover / Investigate / Prepare navigation, mobile disclosure, focus controls and presentation settings isolated from research. Exit restores research.
- M4 d67632d: opt-in offline preparation, SHA-256/byte verification, atomic cache pointer, corruption rollback and fully offline app/science/imagery/exports. External tiles/citations remain online-only.
- M5 ac81ab8: actual Copernicus DSM/masks plus MOLA/LOLA, 40 common-support pilot comparisons, two physical averaging widths and offset/numerical sensitivity. Separate from original SRTM F/U/C/P. Original supplied logo shape and independent Mars placement retained.

Validation: 67 Python tests plus independent reproduction; 61 TypeScript science tests; 24/24 production-preview browser workflows. Visual sweep 25 page/viewport combinations (390–1568px): no overflow, missing images, framework overlays or app/console errors after fixing a tablet decorative-grid overflow. Chrome/Playwright used because Browser plugin was not available. Static build passes; dependency bundle-size warnings are nonfatal and map loads lazily. QA assets are ignored under outputs/release3-qa.

Original science unchanged: 130 POWER cells, 16 automatic candidates, 10 preliminary characterized under default assumptions, 4 reference benchmarks, 20 climate/SRTM profiles, 2 genuine planetary grids, 19 mapped geology contexts. Dataset SHA-256 3515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c. Current science release science-bdf38c65827e398b. Full raw rasters are ignored; pinned labels/hashes/derived grids and reproducible acquisition scripts are committed. Rasterio 1.5.2 is the new preprocessing dependency; lockfile updated.

## Laptop session (cloud workspace) — Release 4 track

Work continued from the laptop after Release 3 (`efa7194`). Each milestone below is committed and pushed separately; the newest entry is the recovery point.

- **L1 fix pass** — `scripts/validate_results.py` no longer rewrites `generated_at` when the substantive validation is unchanged, so re-running validation stops minting a new "immutable" science release on every run (seven release folders had accumulated; all historical folders are kept untouched). Metric units now follow SI spacing everywhere (`719.20 m`, `1.27°`) via `unitSuffix()`. Glued words/numbers repaired across STATUS, NEXT_STEPS, README, DEPLOYMENT, LIVE_DEMO, docs/RELEASE_3, TERRAIN_PILOT, QA, SOURCE_RESEARCH and REVIEW, with hashes, Site ID and file names preserved. Science release unchanged: `science-bdf38c65827e398b`.

- **L2 Field Study Builder** (`/field-study`, Prepare → Field study; also "Plan a field study" on Cases and Research). Stations are placed on a relief view interpolated between the candidate's real 7×7 SRTM samples (dots, 4 km spacing) — click to add, drag or arrow keys to move, Delete to remove; five station types. Geometry mirrors `science/ingestion/srtm.py` exactly (unit test reproduces the OpenTopoData request coordinates). Great-circle legs and bearings on the 6371 km sphere, interpolated elevation trend profile, ascent/descent and a Naismith walking-time heuristic, all labelled as regional trend, not route or hazard survey. "Suggest relief transect" runs lowest → highest real node. Protocol is seeded from the dataset's own experiment design (hypothesis, measurements, equipment, success indicator, cannot-reproduce list); equipment grows with station types. Sample-documentation fields and label IDs, seven permit/access questions with answers, local notes, plan-readiness ring. Save/reopen on device; JSON export embeds the full research snapshot (release, dataset SHA-256, model) and import refuses a different release; GPX 1.1 export; print-only field book with planner map, station sheets with blank observation lines and cut-out sample labels. Files: `frontend/src/lib/fieldStudy.ts`, `components/FieldPlanner.tsx`, `pages/FieldStudy.tsx`, `styles/fieldstudy.css`, tests `src/lib/__tests__/fieldStudy.test.ts` (8) and `tests/fieldstudy.spec.ts` (2). Checks: 69 unit tests, 25/25 production-preview browser workflows (+1 live-imagery skip offline).

- **L3 Discovery Lenses** (`/lenses`, Discover → Lenses). Six declared, versioned (`terrainx-lenses-v1`) read-only rankings of the 16 automatic candidates per mission: Release baseline (reproduces `rank()` exactly), Your model (active What-if scenario), Terrain twin (F only), Evidence-weighted utility (U×C, geology required), Operations rehearsal (0.6 terrain suitability + 0.4 dry-environment), Pessimistic evidence (αF + (1−α)U_min, every missing criterion at 0). Benchmarks excluded; unscorable candidates listed "not ranked" with reason; ties by id. Rank-flow (bump) chart with hover/pin candidate story, per-lens table with inputs and agreement chips, explicit "None ranked" notes. Finding made visible: for Mare Crisium no automatic candidate has assessed geology, so baseline/evidence lenses rank none — terrain and operations lenses still rank all 16. Files: `frontend/src/lib/lenses.ts`, `pages/Lenses.tsx`, `styles/lenses.css`, tests `src/lib/__tests__/lenses.test.ts` (11) and `tests/lenses.spec.ts` (2). A cell-level mission-aware search (130 POWER cells) still needs new terrain/geology fetches for every cell and remains future work. Checks: 80 unit tests, 27/27 browser workflows (+1 live-imagery skip offline).

- **L4 navigation & integration** — Command palette (Ctrl/⌘ K, `/`, or the search pill in the header): fuzzy jump to every page and to each candidate's Analog DNA, Field study or Passport, full keyboard control and Escape from anywhere. Header actions regrouped so search + Guided demo never collide at desktop/tablet/phone widths. Landing "Discover · Compare · Explain · Prepare" band now opens Explorer, Lenses, Frontier and Field Study. Analog DNA gains "Plan a field study". Files: `components/CommandPalette.tsx`, `styles/palette.css`, tests `src/lib/__tests__/palette.test.ts`, `tests/palette.spec.ts`. Checks: 81 unit tests, 28/28 browser workflows (+1 live-imagery skip offline).

- **L5 field-study share links** — "Copy share link" encodes title, hypothesis and stations (base64url JSON, Zod-validated on open) into `#/field-study?share=…`; it opens only on the identical science release and refuses damaged or mismatched links with a stated reason. The printed field book carries a compact QR (stations rounded to 1e-5° ≈ 1 m, no free text) sized to scan from paper — decoding verified with OpenCV on a 3× print render. Tests: 84 unit, 29/29 browser workflows (+1 live-imagery skip offline).

- **L6 guided demo chapters** — the demo now has nine scenes. New Scene 5 "Six questions" shows the five Mars candidates most consistent across the six Discovery Lenses (live from `lenses.ts`, presentation model), and states that the Moon baseline ranks 0 candidates because no lunar basalt is mapped while the terrain lens ranks 16. New Scene 8 "Take it outside" builds a relief transect for the lead candidate from its real SRTM grid (stations, traverse length, ascent, Naismith estimate) with an elevation-trend sparkline and a link into the Field Study Builder. Demo browser test updated to nine scenes.

### In progress (laptop)
- **L7 data acquisition for the 130-cell search** — the laptop's built-in browser is fetching the 114 missing OpenTopoData SRTM grids and 114 Macrostrat lookups (URLs proven byte-identical to the pipeline's cache keys by a SHA-256 over the URL list, `ab65b23b…22bc`); raw bodies + body SHA-256 are saved to Downloads and imported into `data/cached/` in the exact CachedHTTP format. LOLA `ldem_16.img` (33,177,600 bytes, pinned SHA-256 `a511e40d…54cb`) follows for the lunar polar module.

### Planned next (laptop)
1. L8 mission-aware 130-cell search (separate versioned experiment; released discovery unchanged).
2. L9 lunar south-polar module from checksum-verified LOLA LDEM_16.

Cloud-session limits: the sandbox shell cannot reach map tiles, NASA, POWER, OpenTopoData or Macrostrat, so new external observations are only added when they can be fetched and checksum-verified. Publishing to the public Site remains a PC-side step.

## Remaining release step

Publish the verified Release 3 build to existing public Site appgprj_6af7ff7626888191bcba757337fd7e9b, https://terrainx-discovery-lab.comfybay1.chatgpt.site. Audience is already verified public. Do not create another Site. Record exact source/version/deployment and public checks, then commit/push the completion notes. The previously deployed ca32f17 is the older Release 2 until this final publication succeeds.

## Resume

Read NEXT_STEPS.md, docs/RELEASE_3.md, LIVE_DEMO.md and DEPLOYMENT.md. Inspect git status/log before acting; pull --ff-only only if clean. Use Node 24 and Python 3.12. No API key required. After every completed milestone update notes, commit, push and verify remote HEAD with scripts/checkpoint.ps1. A sudden interruption can still lose edits made after the latest push; these checkpoints are the recovery boundary. Never persist credentials.

No field verification, confirmed new analog, lunar-basalt match, rover safety result or NASA approval is claimed. The pilot is experimental; external providers can fail. Optional lunar-polar/Diviner, broader search and field-study planning remain future work.
