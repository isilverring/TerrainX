# Resume TerrainX

1. Inspect `git status --short --branch` in `D:\TerrainX`.
2. Check `STATUS.md` and `DATA_STATUS.md` for completed and unavailable integrations.
3. `.venv\Scripts\python.exe -m pytest -q` runs science tests (40 passing at the last checkpoint).
4. `.venv\Scripts\python.exe scripts\build_planetary_profiles.py` refreshes real planetary grids. `.venv\Scripts\python.exe scripts\build_discovery.py` resumes successful cached acquisition and packages app data.
5. `cd frontend; npm run dev` serves the implemented application. `npm run build` currently passes strict TypeScript and static Vite production build.
6. Run `.venv\Scripts\python.exe scripts\validate_results.py` from root for the test+reproduction report.
7. Finish Playwright browser/mobile/print QA, deployment packaging and scientific/project documentation. Current source contains all requested routes.

Never substitute synthetic observations for inaccessible NASA data. Test fixtures must remain in tests.
