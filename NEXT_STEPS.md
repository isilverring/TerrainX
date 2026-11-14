# Resume TerrainX

1. Inspect `git status --short --branch` in `D:\TerrainX`.
2. Check `STATUS.md` and `DATA_STATUS.md` for completed and unavailable integrations.
3. `.venv\Scripts\python.exe -m pytest -q` runs science tests (48 passing at the last checkpoint).
4. `.venv\Scripts\python.exe scripts\build_planetary_profiles.py` refreshes real planetary grids. `.venv\Scripts\python.exe scripts\build_discovery.py` resumes successful cached acquisition and packages app data.
5. `cd frontend; npm run dev` serves the implemented application. `npm run build` currently passes strict TypeScript and static Vite production build.
6. Run `.venv\Scripts\python.exe scripts\validate_results.py` from root for the test+reproduction report.
7. Development and production Playwright runs each passed all 4 workflows. `npm test` defaults to 127.0.0.1:5173; set `TERRAINX_BASE_URL` to test a production preview. Curated screenshot review is complete in `docs/QA.md`.
8. Run root `npm run build` to prepare root `dist/`; package/publish the existing Sites identity using the Sites skill. Recover fresh source credentials for the same project if needed. Do not persist tokens.
9. Finish `docs/QA.md`, curated screenshots, exact publication status and final README/status checkpoint. Push main and verify remote SHA matches.

Never substitute synthetic observations for inaccessible NASA data. Test fixtures must remain in tests.
