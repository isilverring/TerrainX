# Resume TerrainX safely

All work stays in **D:\TerrainX**. Repository: private isilverring/TerrainX, branch main.

1. Read STATUS.md, DEPLOYMENT.md, DATA_STATUS.md, SCIENCE.md and docs/REVIEW.md.
2. Run git status --short --branch and git log -5 --oneline, then git pull --ff-only if clean.
3. Use Node 22.12+ (24 recommended). Run npm --prefix frontend ci, then npm run dev → http://127.0.0.1:5173.
4. Science: .venv\Scripts\python.exe scripts\validate_results.py (63 Python tests plus independent reproduction). Frontend science: npm run test:unit (52 tests).
5. Build: npm run build. Preview: npm run preview → http://127.0.0.1:4173. With a server running, npm test runs 16 browser workflows. Set TERRAINX_BASE_URL for production preview. TERRAINX_OFFLINE=1 explicitly skips live-provider checks.
6. After each completed module, update notes, run relevant checks and use scripts/checkpoint.ps1 -Message "describe the milestone". It commits, pushes and verifies the remote SHA.

Prompt 1 and Prompt 2 are implemented. Review repaired scientific evidence/state/ranking contracts, added NASA image caching and retained the supplied logo geometry with improved contrast. Mars is enlarged and independent of the illustrative lunar orbit. Check STATUS.md for publication completion; do not claim deployment until its success/access checks are recorded.

Refresh data only when needed: build_planetary_profiles.py, build_planetary_context.py, build_discovery.py --offline, cache_worlds_images.py under scripts/. Never replace real observations with generated arrays.

Optional future work: matched effective-resolution filtering, field mineralogy/terrain validation, or separately validated Diviner/SAR/Sentinel additions. These are not claimed as completed science.
