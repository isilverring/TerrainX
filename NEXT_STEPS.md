# Resume TerrainX

Work in `D:\TerrainX` (PC) or `C:\TerrainX` (laptop); both track `origin/main`. Do not restart from an empty scaffold.

1. `git pull` (the laptop folder may need a fresh `git clone https://github.com/isilverring/TerrainX C:\TerrainX` if it only contains `.dist`). Then `git status --short --branch` and `git log -5 --oneline`.
2. Read STATUS.md, DATA_STATUS.md, SCIENCE.md and `docs/ENHANCEMENT_PLAN.md` (progress log at the bottom).
3. Local app: `npm --prefix frontend ci` then `npm run dev` from root → http://127.0.0.1:5173. Node 22+.
4. Science checks: `.venv\Scripts\python.exe scripts\validate_results.py` (57 checks) and `.venv\Scripts\python.exe -m pytest -q`.
5. Browser tests: `npm test` with the dev server running (needs Chrome and live tiles; set `TERRAINX_OFFLINE=1` without map access).
6. Rebuild data only when needed: `scripts/build_planetary_profiles.py`, `scripts/build_planetary_context.py`, then `scripts/build_discovery.py` (`--offline` uses cached Earth requests).
7. After each completed module: update STATUS/NEXT_STEPS/plan log, run checks, `scripts/checkpoint.ps1 -Message "..."`.

## Prompt 2 status
All 12 Prompt 2 sections are implemented (see STATUS.md "Prompt 2 progress"). Unit tests: `npm run test:unit` (45). Browser: `npm test` (13 workflows; `TERRAINX_OFFLINE=1` in sandboxes).

## Suggested next work
- **Visual QA with live services** of Compare Worlds images, the 96 km Earth context surface and 3D fly-to on a real GPU browser.
- **Redeploy** the private preview (or a public Netlify/Vercel judge build) from the PC; the hosted preview still runs commit `a058c1c`.
- **Visual QA on a real GPU/browser**: 3D terrain fly-to (pitch ~62°), globe toggle, GIBS date picker edge dates, and the 96 km Earth context surface (it renders from live AWS tiles, which the cloud sandbox could not reach; only the analysis-lattice fallback and planetary context were rendered there).
- Optional from the plan: drape a verified NASA Trek / CTX / LRO WAC image on the planetary 3D patch (check URL and licence first).
- Refresh `docs/QA.md` and `docs/screenshots/` from a machine with live tiles (new sandbox screenshots are in `docs/screenshots/*-v2*`, `compare-desktop.png`, `landing-live-globe.png`, `viewer-crisium-lattice.png`).
- Science extensions (unchanged): matched physical-support sensitivity analysis, field mineralogy/terrain validation, or carefully sourced Diviner/SAR/Sentinel/JAXA additions. Never infer geology from dryness; never score visualisation layers.
