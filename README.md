# TerrainX

**Planetary Analog Discovery & Mission Readiness Lab**

“Before we land on another world, let's discover where to practice on ours.”

A working static React/Vite scientific discovery application and reproducible Python pipeline for the 2026 NASA Space Apps challenge, [Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/). Independent project; NASA data use does not imply endorsement.

All work stays in **D:\TerrainX**, tracking `origin/main`. Private repository: [isilverring/TerrainX](https://github.com/isilverring/TerrainX). **[Open the public audience demo](https://terrainx-discovery-lab.comfybay1.chatgpt.site)**. Read [STATUS.md](STATUS.md), [NEXT_STEPS.md](NEXT_STEPS.md) and [DATA_STATUS.md](DATA_STATUS.md) before resuming after a stop, power issue or usage limit.

## Current audited release

The six approved challenge improvements are implemented. Canonical handoff/checklist: [docs/CHALLENGE_COMPLETION.md](docs/CHALLENGE_COMPLETION.md). Local acceptance: **85 Python tests plus independent reproduction,94 TypeScript tests,43 production browser workflows and90 responsive route/width cases**. Public version6/source e201ffb passes all43 fresh unauthenticated workflows and21 focused public visual cases. Exact publication/rollback details: [DEPLOYMENT.md](DEPLOYMENT.md).

Original study and Expanded search are explicit collections. The latter exposes134 unique profiles (130 screened cells +4 benchmarks) through map, DNA, Passport, comparison and field planning while retaining frozen original records. Polar references keep their own identities through dossiers and field replay; polar utility is unassessed, coverage0 and combined priority null. The original130-cell/16-candidate/4-benchmark results remain unchanged.

Common-support processing now covers18 selected sites,33 Copernicus tiles and360 valid Earth/target support-offset comparisons. Scoped primary literature adds a local volcanic-material contradiction and an unresolved regional sedimentary case. These are research hypotheses, not confirmed analog discoveries. Start with the five-step **/guide**, then use **Research tools** for advanced analysis. [Case evidence](docs/CANDIDATE_CASES.md), [terrain reproduction](docs/TERRAIN_PILOT.md), [submission steps](docs/SUBMISSION_GUIDE.md), [live demo/deployment](LIVE_DEMO.md).

## Working experience

Release 3 adds immutable, checksummed science releases; save/export/import of exact research models; an Evidence Inspector; three source-scoped case studies; Discover / Investigate / Prepare navigation; presentation settings isolated from research; and verified offline demo preparation. A separate **Terrain pilot** compares real Copernicus/MOLA/LOLA terrain under common 8/12 km aggregation supports and 40 processing scenarios. Original SRTM discovery scores remain unchanged. See [docs/RELEASE_3.md](docs/RELEASE_3.md) and [docs/TERRAIN_PILOT.md](docs/TERRAIN_PILOT.md). Keep historical frontend/public/releases folders intact. Scientific model changes require a new model version or an explicit compatibility implementation.

Landing with a live rotating globe of the real candidates and headline counts; Mars/Jezero and Moon/Mare Crisium Explorer; interactive MapLibre Earth atlas fitted to the four study regions, with ranked persistent markers, hover tooltips, study-region boxes and the selected candidate's POWER cell, 24 km SRTM lattice and 49 sample positions. Basemaps: Esri Dark Gray, Esri World Imagery, dated NASA GIBS daily imagery (MODIS Terra/Aqua, VIIRS SNPP) and NASA Blue Marble relief, plus optional 3D terrain (AWS Terrain Tiles, visualisation only), hillshade and a globe view. Results are grouped so characterized candidates always rank before screened ones, sortable by U, C, F or P, searchable, keyboard-navigable (↑/↓) and comparable side by side (up to three). Separate F/U/C and gated P; adjustable normalized mission weights; Analog DNA with real values/units and a side-by-side 3D terrain viewer (Earth vs MOLA/LOLA at the same scale); geological citations; Reality Gap; field hypothesis; printable Analog Passport with a QR/URL link; Methodology and source register. Mobile mission drawer, reduced-motion support, lazy map/charts/viewer and runtime Zod data validation are implemented.

No application authentication, database, backend, paid API, LLM or judge-time NASA query is required. Cached data are versioned. Map tiles and external source links need internet; science panels work if tiles fail.

### Prompt 2 — advanced science and visual enhancements

- **Discovery Frontier** (`/frontier`): decision sensitivity to missing evidence — hypothetical U bounds with each missing criterion at 0 and 1, P interval, benchmark crossing, possible rank range and declared Measurement Priority; the Passport adds "What should we measure next?".
- **Planetary Transfer Lab** (`/transfer-lab`): Froude number and matched speed, slope force components, dynamic pressure from NASA POWER PS/T2M/WS10M versus a labelled Mars scenario and the Moon, and a deterministic transfer-gap summary.
- **Analog Forensics** (Analog DNA): measured 2D heightmaps and slope maps (3D optional), 1×/3×/5× exaggeration, profiles, a quantitative table and resolution warnings.
- **What if the mission changes?** (`/what-if`): adjust α, weights, minimum coverage and tolerances; before/after ranks explained by an exact ΔP decomposition; Pareto frontier; seeded ranking-stability analysis.
- **Compare Worlds** (`/worlds`): verified original NASA imagery (Lake Salda ↔ Jezero, Harrat Khaybar ↔ Mare Crisium) with sourced annotations and limits.
- **Expedition Packet** (`/expedition/:id`): printable brief plus JSON, CSV and GeoJSON exports of the active state.
- **Beyond the known analogs** (landing) and the **guided demo** (`/demo`, "From Earth to another world").

### Release 4 track (laptop)

- **Field Study Builder** (`/field-study`): place proposed stations on the candidate's real SRTM sample grid, measure great-circle legs and the interpolated elevation trend, seed the protocol from the dataset's experiment design, answer permit/access questions, then save, export JSON (with the pinned research snapshot) and GPX, or print a field book with station sheets, sample labels and a scannable QR; "Copy share link" reopens the same stations on another device (same science release only). Proposals only — no access, exposure or safety is verified.
- **Discovery Lenses** (`/lenses`): six declared, reproducible rankings of the same shortlist (baseline, your model, terrain twin, evidence-weighted, operations rehearsal, pessimistic evidence) in a rank-flow chart, with benchmarks excluded and missing geology never rewarded.
- **Search every cell** (`/cells`): all 130 screened cells characterized with real SRTM terrain and Macrostrat geology and ranked for each mission; finds the first lunar-eligible (mapped basalt) cell. Separate versioned experiment; released discovery unchanged.
- **Lunar south pole** (`/lunar-pole`): checksum-verified NASA LOLA terrain at the IAU centres of the features naming NASA's Artemis III candidate regions, with Earth relief twins. See [docs/CELL_SEARCH_AND_POLAR.md](docs/CELL_SEARCH_AND_POLAR.md).
- **Challenge fit** (`/challenge`): every dimension named by the 2026 challenge mapped to TerrainX, with gaps marked. Plan to submission: [docs/PLAN.md](docs/PLAN.md). Vercel: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).
- **Command palette** (Ctrl/⌘ K or `/`): jump to any page or to a candidate's dossier, field study or passport from the keyboard.

## Run locally

Node24.x and Python 3.12 recommended. This workstation has Python 3.12 via `py -3.12`; its Windows Store `python` alias is not a usable interpreter. Use a supported Node runtime; this release is validated with Node 24.22.1.

```powershell
Set-Location D:\TerrainX
npm --prefix frontend ci
npm run dev
```

Open **http://127.0.0.1:5173/**.Scientific JSON is already included; preprocessing is not needed simply to run the app.

## Reproduce science

```powershell
Set-Location D:\TerrainX
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe scripts\fetch_geography.py
.\.venv\Scripts\python.exe scripts\build_planetary_profiles.py
.\.venv\Scripts\python.exe scripts\build_planetary_context.py
.\.venv\Scripts\python.exe scripts\build_discovery.py
.\.venv\Scripts\python.exe scripts\build_terrain_pilot.py
.\.venv\Scripts\python.exe scripts\validate_results.py
```

Successful requests are cached. Rerun `build_discovery.py --offline` to regenerate from cached Earth inputs. An interrupted run writes completed candidates atomically and resumes using successful caches. Planetary downloads use `.partial` files then rename. The two 33MB rasters are ignored by Git; labels, checksums and exact native extraction pixels are committed. Fresh clones can re-download with the planetary script.

## Validate and build

```powershell
.\.venv\Scripts\python.exe scripts\validate_results.py
npm run build
npm run test:unit          # 89 Vitest unit tests of the TypeScript science
# With the dev server running in another terminal:
npm test
# In a sandbox without outbound map access:
#   $env:TERRAINX_OFFLINE=1; npm test
npm --prefix frontend audit
```

Current scientific validation: **81 Python tests and89 TypeScript unit tests**, plus independent reproduction of saved metrics/scores. Strict TypeScript and static production build pass. Playwright uses installed Chrome and runs **38 production-preview workflows**, including custom-model export/shared-link round trips, real NASA imagery, live AWS context, map fallback and mobile science layouts. `TERRAINX_OFFLINE=1` skips live-provider checks. On another machine install Chrome or adjust the channel in `frontend/playwright.config.ts`. Dependency audit reports zero known vulnerabilities. See `docs/REVIEW.md` for the teammate review and repairs.

New dependencies in this release: `qrcode-generator` (MIT, Passport QR) and dev-only `vitest` 5. Release 3 adds rasterio 1.5.2 and its locked Python dependencies for the offline scientific preprocessing; no frontend package dependencies, backend, API key or paid service were added.

## Static deployment

`npm run build` builds `frontend/dist`, generates a verified first-party offline catalogue and copies a clean root **dist/** release. Open Prepare → Offline while online, click Prepare, then rehearse after disabling the network. Third-party tiles and external source links remain online-only. Hash routes work on static hosts without server rewrites. No runtime secrets/environment variables are required.

- **Netlify:** import using `netlify.toml`; base:`frontend`; build:`npm ci && npm run build`; publish:`dist`; Node24.
- **Vercel:** import root using `vercel.json`; install frontend dependencies; run root `npm run build`; serve root `dist`; Node24, no framework preset.
- **Sites:** `.openai/hosting.json` retains the existing project. The owner requested public audience access during the review. Verified publication/access state is recorded in DEPLOYMENT.md. Do not duplicate the Site or change its audience without instruction.

For a step-by-step public deployment and presentation guide, read **[LIVE_DEMO.md](LIVE_DEMO.md)**. The supplied orbital X logo is retained as a high-contrast vector rendition. Verified NASA comparison images are bundled with source URLs, attributions and SHA-256 in `frontend/public/nasa/imagery-manifest.json`; refresh with `python scripts/cache_worlds_images.py`.

## Actual findings and limits

130 real cells; 16 automatic candidates; 10 preliminary characterized candidates; 4 benchmarks; 20 real climate profiles; 20 SRTM grids; 2 planetary DEM profiles; 19 mapped geologies; no acquisition errors. No original16-candidate entry establishes direct lunar-basalt relevance; the separate130-cell search has one regionally mapped basalt lead requiring field verification. No field experiment or NASA certification is claimed.

POWER cells are not outcrop measurements. SRTM≈90 m native support is sampled at 4 km, not used as a 90 m hazard map. Common spacing does not eliminate unequal Earth/MOLA/LOLA support. Mapped lithology is not verified mineralogy. Scores are declared assumptions, not probabilities. Read [SCIENCE.md](SCIENCE.md), [DATA_SOURCES.md](DATA_SOURCES.md) and the in-app methods.

## Recovery and durable checkpoints

After each completed module:update status/next steps, run relevant checks, then:

```powershell
.\scripts\checkpoint.ps1 -Message "feat: describe completed module"
```

This commits, pushes main, and verifies local/remote SHAs match. Never store credentials in files. A sudden shutdown can lose edits since the latest checkpoint; GitHub commits are the recovery boundary. Browser selection/weights are local convenience state; scientific release data are versioned.

See [DEMO.md](DEMO.md) for the 90-second judge demonstration and scientific caveats.
