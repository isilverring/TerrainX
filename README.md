# TerrainX

**Planetary Analog Discovery & Mission Readiness Lab**

TerrainX helps researchers choose Earth sites for Moon and Mars field experiments. It compares terrain, mission utility and evidence coverage, explains where an analogy fails, and turns the remaining questions into a field-study proposal.

**[Open TerrainX](https://terrainx-discovery-lab.comfybay1.chatgpt.site)** · [Methods](SCIENCE.md) · [Data sources](DATA_SOURCES.md) · [Demo](DEMO.md)

Built for the [2026 NASA Space Apps challenge on Earth analogs for Moon-base locations and Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/). This independent project uses open NASA and partner data; it has no NASA endorsement.

## Explore the application

| Workspace | What it does |
|---|---|
| Discovery atlas | Explore real study sites on MapLibre maps with Esri imagery, dated NASA GIBS layers, optional AWS terrain and a local geographic fallback. Filter, rank and compare up to three sites. |
| Analog DNA and Passport | Inspect source values, terrain grids, geology, model assumptions and evidence gaps. Export a reproducible dossier or print a Passport with its research link. |
| Search every cell | Compare 130 characterized cells and four benchmarks in an expanded collection, separate from the original study. |
| Lunar south pole | Compare eight historical feature-centre LOLA profiles and model-derived Diviner summaries. Preserve the selected polar reference through comparisons and studies. |
| Research Lab | Investigate mineralogy, thermal and solar conditions, water/resources, dust, biology, caves, operations and lunar-base trade-offs. Export an analysis and create a matching field protocol. |
| Field Study Builder | Propose stations, protocols and equipment; save or share the pinned study; export JSON/GPX or print a field book. |
| Supporting analysis | Test missing-evidence sensitivity, mission weights, transfer physics, ranking lenses and common-support terrain comparisons. |
| Guided demo and pitch | Follow the evidence-to-experiment story or present the ten-slide deck. |

Start at `/#/guide` for a five-step introduction. Advanced workspaces are under **Research tools**. Ctrl/⌘ K opens the command palette.

## Findings and scientific limits

The original study contains **130 screened cells, 16 automatic candidates, 10 preliminary characterized candidates and four separate benchmarks**. The expanded search exposes 134 unique profiles. The common-support terrain study covers 18 Earth sites and 360 Earth/target support-offset comparisons.

Fidelity (F), utility (U) and evidence coverage (C) are separate. Combined priority (P) is available only when the model's evidence gates are met. Scores express declared assumptions, not probabilities or field confirmation. Missing evidence remains unavailable.

POWER grid cells are not outcrop measurements. The original SRTM analysis samples nominal 90 m data at 4 km spacing. Mapped rock units do not establish mineral phases. Diviner products model thermal and ice-stability conditions; they do not detect ice. Lunar feature centres are not landing polygons. Research Lab scenarios do not alter released observations or discovery scores. See [SCIENCE.md](SCIENCE.md) and [DATA_STATUS.md](DATA_STATUS.md).

## Run locally

Use Node 24.x. Python 3.12 is needed only for scientific reproduction.

```sh
git clone https://github.com/isilverring/TerrainX.git
cd TerrainX
npm --prefix frontend ci
npm run dev
```

Open http://127.0.0.1:5173/. Versioned scientific data are included. The static application needs no account, backend, paid service or API key. External map tiles and source links require internet; cached science remains available when providers fail.

## Validate and build

```sh
npm run test:unit
npm run build
npm run preview
```

With preview running at http://127.0.0.1:4173/, set `TERRAINX_BASE_URL` to that URL and run `npm test`. The browser suite uses installed Chrome by default; `TERRAINX_BROWSER_CHANNEL=chromium` selects Chromium. `TERRAINX_OFFLINE=1` skips live-provider requirements. CI runs scientific, unit, build and offline-capable browser checks.

Scientific validation on Windows:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
.\.venv\Scripts\python.exe scripts\validate_results.py
```

Validation includes 94 Python tests and independent reproduction of original metrics/scores, plus 117 frontend unit tests. Browser and publication results are recorded in [docs/QA.md](docs/QA.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

## Reproduce the data

Source responses, units, periods, coordinates, hashes and derived profiles are retained. Large raster and kernel binaries are reproducibly downloadable and excluded from Git. Historical `frontend/public/releases/` folders are immutable; research snapshots pin their release and model.

- [Core methods and pipeline](SCIENCE.md)
- [Source verification](docs/SOURCE_RESEARCH.md)
- [Expanded search and polar profiles](docs/CELL_SEARCH_AND_POLAR.md)
- [Common-support terrain](docs/TERRAIN_PILOT.md)
- [Literature case geography](docs/CANDIDATE_CASES.md)
- [Research Lab methods](docs/PARTIALS_IMPLEMENTATION.md)

## Deployment and offline use

`npm run build` produces the static `dist/` directory and a verified offline catalogue. The repository includes Vercel, Netlify and Sites configuration. [Deployment instructions](docs/DEPLOY_CHATGPT_SITE.md) describe the current host; [DEPLOYMENT.md](DEPLOYMENT.md) records exact published versions and rollback identifiers.

For a rehearsal, open **Research tools → Offline → Prepare offline demo** while online. Wait for readiness before disconnecting. Previously prepared browsers must explicitly activate a prepared update. Third-party maps and external citations remain online-only.

The brand mark and illustrative globe are separate from scientific imagery. Bundled NASA comparison images retain their original source and integrity metadata. Submission materials and tool acknowledgements are in [SUBMISSION.md](SUBMISSION.md) and [docs/SUBMISSION_GUIDE.md](docs/SUBMISSION_GUIDE.md).
