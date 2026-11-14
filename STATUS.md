# TerrainX recovery checkpoint

Release3 code and science are complete and pushed to private https://github.com/isilverring/TerrainX, main. All work remains **D:\TerrainX**. Public release packaging/publication is the current step; check DEPLOYMENT.md for the exact deployed source rather than assuming the latest GitHub commit is live.

## Verified implementation

- M1 c52fb8d: immutable science releases; Research snapshots save/export/import exact models and candidate context. Links pin release/hash/model and refuse unavailable historical inputs.
- M2 04d38fd: click-through Evidence Inspector, spatial support schematic and source-scoped Saudi/Chile/Salda cases.
- M3 1cd1ccb: Discover / Investigate / Prepare navigation, mobile disclosure, focus controls and presentation settings isolated from research. Exit restores research.
- M4 d67632d: opt-in offline preparation, SHA256/byte verification, atomic cache pointer, corruption rollback and fully offline app/science/imagery/exports. External tiles/citations remain online-only.
- M5 ac81ab8: actual Copernicus DSM/masks plus MOLA/LOLA,40 common-support pilot comparisons, two physical averaging widths and offset/numerical sensitivity. Separate from original SRTM F/U/C/P. Original supplied logo shape and independent Mars placement retained.

Validation:67 Python tests plus independent reproduction;61 TypeScript science tests;24/24 production-preview browser workflows. Visual sweep25 page/viewport combinations (390–1568px): no overflow, missing images, framework overlays or app/console errors after fixing a tablet decorative-grid overflow. Chrome/Playwright used because Browser plugin was not available. Static build passes; dependency bundle-size warnings are nonfatal and map loads lazily. QA assets are ignored under outputs/release3-qa.

Original science unchanged:130 POWER cells,16 automatic candidates,10 preliminary characterized under default assumptions,4 reference benchmarks,20 climate/SRTM profiles,2 genuine planetary grids,19 mapped geology contexts. Dataset SHA2563515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c. Current science release science-bdf38c65827e398b. Full raw rasters are ignored; pinned labels/hashes/derived grids and reproducible acquisition scripts are committed. Rasterio1.5.2 is the new preprocessing dependency; lockfile updated.

## Remaining release step

Publish the verified Release3 build to existing public Site appgprj_6af7ff7626888191bcba757337fd7e9b, https://terrainx-discovery-lab.comfybay1.chatgpt.site. Audience is already verified public. Do not create another Site. Record exact source/version/deployment and public checks, then commit/push the completion notes. The previously deployed ca32f17 is the older Release2 until this final publication succeeds.

## Resume

Read NEXT_STEPS.md, docs/RELEASE_3.md, LIVE_DEMO.md and DEPLOYMENT.md. Inspect git status/log before acting; pull --ff-only only if clean. Use Node24 and Python3.12. No API key required. After every completed milestone update notes, commit, push and verify remote HEAD with scripts/checkpoint.ps1. A sudden interruption can still lose edits made after the latest push; these checkpoints are the recovery boundary. Never persist credentials.

No field verification, confirmed new analog, lunar-basalt match, rover safety result or NASA approval is claimed. The pilot is experimental; external providers can fail. Optional lunar-polar/Diviner, broader search and field-study planning remain future work.
