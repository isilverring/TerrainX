# TerrainX checkpoint

## Current state (2026-11-14, laptop cloud session)
**Prompt 1 MVP complete; enhancement plan A, B and C delivered** (see `docs/ENHANCEMENT_PLAN.md` progress log). Source is in the private `https://github.com/isilverring/TerrainX` repository on `main`; the laptop folder `C:\TerrainX` should be refreshed with `git pull` (it was empty apart from `.dist` at the start of this session, and all work happened in a cloud clone pushed after each milestone).

Delivered in this session, in pushed milestones:
1. Explorer UX: evidence-tier ranking (characterized before screened for every sort key U/C/F/P, nulls last), search, ↑/↓ keyboard navigation, map fitted to the four study regions with region boxes, persistent ranked markers with tooltips, merged layers/legend control, status icons that follow source state, safe storage, Mars/Moon glyphs.
2. Imagery and 3D map: Esri World Imagery, dated NASA GIBS (MODIS Terra/Aqua, VIIRS SNPP), Blue Marble; AWS terrarium 3D terrain + hillshade, sky, globe toggle; selected POWER cell, 24 km SRTM lattice and its 49 sample points. Endpoints and rendering verified live in a browser.
3. Side-by-side 3D terrain viewer (Analog DNA): 24 km analysis lattice (exact F inputs) and 96 km visualisation-only context (MOLA/LOLA native windows + live AWS terrain for Earth).
4. Compare mode (`/compare`, up to 3), live landing globe with dataset counts, Passport QR/URL block and print pagination, ~40 glued-text fixes (dataset regenerated offline: text only, zero numeric changes).

Checks at the last checkpoint: 57 Python scientific tests pass; `validate_results.py` 57 passed; strict TypeScript + production build pass; 6 Playwright workflows pass (run with `TERRAINX_OFFLINE=1` in the cloud sandbox, which cannot reach map tile hosts); `npm audit` 0 vulnerabilities.

The owner-private preview at https://terrainx-discovery-lab.comfybay1.chatgpt.site still serves the **older** Prompt 1 build (commit `a058c1c`). Redeploy from the PC to publish these enhancements.

## Prompt 1 baseline (still true)
- 130 real POWER cells across four bounded regions;16 algorithmic candidates;10 preliminary characterized automatic candidates;4 separately labelled benchmarks.
- 20 real climate profiles,20 SRTM49-point grids,2 real metadata-validated MOLA/LOLA grids,19 mapped geological responses;no acquisition errors.
- 48 scientific tests pass plus independent reproduction of the saved shortlist,terrain metrics,F/U/C and eligible P.
- Landing, Explorer,mission/region/evidence filters, MapLibre+GIBS,adjustable normalized mission weights, Analog DNA, Reality Gap,field hypothesis,printable Passport and Methodology implemented.
- 4 browser workflows pass in both development and production preview. Desktop 1568x1003 and mobile 390x844;zero page/console errors in the successful main workflow;live GIBS verified;blocked-basemap fallback tested.
- Strict TypeScript/static production build passes. MapLibre module worker explicitly bundled. Dependency audit: 0 known vulnerabilities.
- Concept-to-render review completed. Curated actual screenshots in `docs/screenshots/`,design references in `docs/design/`,verification ledger in `docs/QA.md`.
- Public Esri dark-gray basemap with local Natural Earth coastline fallback;no API key required. The offered CARTO key was not used or stored.
- README,SCIENCE,DATA_SOURCES,DATA_STATUS,DEMO,deployment configurations,CI and checkpoint helper complete.

## Remaining limits (not unfinished MVP work)
No field validation,local access/permit/safety survey,rover mechanics or NASA certification. Terrain fidelity is exploratory with unequal native support. No automatic candidate has established lunar-basalt relevance in this bounded shortlist. External map tiles are best-effort. The hosted preview is private;public Vercel/Netlify instructions are ready.

## Resume safely
Read NEXT_STEPS.md,DATA_STATUS.md and SCIENCE.md;run `git status --short --branch` and `git log -5 --oneline` before changing anything. The requested MVP is complete. Optional extensions supplied by the user are documented but not claimed as integrated data.

## Durable checkpoint policy
After each future completed module:update these notes,run relevant checks,then `.\scripts\checkpoint.ps1 -Message "feat: describe the completed step"`. It commits,pushes and verifies local/remote SHAs. A sudden shutdown can still lose edits since the last checkpoint; GitHub commits are the recovery boundary. Never persist credentials.
