# Resume the audited TerrainX release

All project work stays **D:\TerrainX**. Private repository https://github.com/isilverring/TerrainX, main. Existing public Site appgprj_6af7ff7626888191bcba757337fd7e9b, https://terrainx-discovery-lab.comfybay1.chatgpt.site. Never create a duplicate or silently change its audience.

1. Read STATUS.md and DEPLOYMENT.md first. Package scope and research limits: docs/PACKAGE_AUDIT.md. Human submission: docs/SUBMISSION_GUIDE.md. Inspect git status/log; pull --ff-only only when clean.
2. Use Node24.x and Python3.12. npm --prefix frontend ci; install requirements-lock.txt in .venv. npm run dev serves127.0.0.1:5173; app data are already cached.
3. .venv\Scripts\python.exe scripts\validate_results.py runs81 tests and independent core reproduction. npm run test:unit runs89 tests.
4. npm run build; npm run preview serves127.0.0.1:4173. Set TERRAINX_BASE_URL to that URL and run npm test for38 production workflows. Local tests use installed Chrome; CI uses Chromium. Set TERRAINX_OFFLINE=1 only to skip live-provider checks, not scientific/offline app tests.
5. Scientific rebuild methods: docs/CELL_SEARCH_AND_POLAR.md and docs/TERRAIN_PILOT.md. Full PDS rasters, Diviner table/chunks and Copernicus TIFFs are ignored but reproducibly downloadable. Source JSON caches, labels, checksums, verification proof and derived grids are committed. No paid key/LLM needed.
6. Preserve frozen frontend/public/releases folders and model versions. New scientific input/equation contracts require a new compatible version. New climate descriptors are not planetary similarity; Diviner ice stability is a model, not measured ice.
7. After each completed milestone: relevant checks, updated recovery notes, scripts/checkpoint.ps1 -Message "describe the milestone". It commits, pushes and verifies remote HEAD. Never store credentials. A push is the recovery boundary; later uncommitted edits can still be lost.

Original logo shape retained; Mars is independent of the illustrative lunar orbit. Field proposals use saved models; full JSON is the complete exchange format. Compact QR is intentionally geometry/default-model only. Presentation preserves research settings. Prepare → Offline verifies first-party assets and keeps the previous complete cache on failed updates; external maps/citations remain online-only.

The bounded software of Packages A/B/C is implemented and audited; the common-support pilot still covers two sites. Global/high-latitude expansion, measured resources, verified caves, field mineralogy and illumination engineering remain research limits. No field validation or NASA certification is claimed. User handles recording, team details, terms and actual event submission. Agent is authorized to deploy the verified build to the existing ChatGPT Site; exact completion is in DEPLOYMENT.md.
