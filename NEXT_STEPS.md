# Resume TerrainX after the completed usability audit

**Current scope is complete:** docs/UX_REFINEMENT.md U1–U3 and docs/CHALLENGE_COMPLETION.md M1–M6. Public version8/runtime778b3cf passes all50 public workflows and36 focused responsive cases. No required implementation or publication step is pending. User handles recording/team/terms/submission; additional research is a new scope.

All work stays **D:\TerrainX**, private https://github.com/isilverring/TerrainX, main. Existing public Site appgprj_6af7ff7626888191bcba757337fd7e9b: https://terrainx-discovery-lab.comfybay1.chatgpt.site. Never create a duplicate or silently change its audience. Read STATUS.md and DEPLOYMENT.md first. Later test/documentation commits intentionally differ from deployed app source; do not redeploy them alone.

1. Inspect git status/log and pull --ff-only only when clean. Review the completed audit, scientific boundaries and latest runtime SHA before making changes.
2. Node24.x/Python3.12. npm --prefix frontend ci; install requirements-lock.txt into .venv if needed. npm run dev serves127.0.0.1:5173. Existing caches permit local use without NASA API keys.
3. Scientific reproduction: .venv\Scripts\python.exe scripts\validate_results.py (85 tests + independent core reproduction). npm run test:unit (99 tests). Validation can rewrite identical JSON line endings; compare substantive content before changing a frozen release.
4. npm run build; npm run preview serves127.0.0.1:4173. Set TERRAINX_BASE_URL and run npm test (50 workflows). Installed Chrome is used locally; CI uses Chromium. Set TERRAINX_OFFLINE=1 only to skip live provider checks. QA servers are currently stopped.
5. Preserve frozen frontend/public/releases, model versions, scientific provenance and null/missing-data gates. Original study20 and Expanded search134 are separate pools. Shared field plans pin their own context; never silently substitute a candidate, planetary reference or protocol.
6. Scientific rebuilds: docs/CELL_SEARCH_AND_POLAR.md, docs/TERRAIN_PILOT.md, docs/CANDIDATE_CASES.md. Large PDS/Copernicus rasters are ignored and reproducibly downloadable; cached source responses, labels, hashes and licences are committed.
7. After every future milestone: relevant checks, recovery notes, scripts/checkpoint.ps1 -Message "describe the completed milestone". Push and verify remote HEAD. Keep credentials in memory. Rebuild after the final runtime-source commit before packaging a new deployment.
8. Publish only runtime changes to the same Site via docs/DEPLOY_CHATGPT_SITE.md. Use LIVE_DEMO.md/DEMO.md for rehearsal and docs/SUBMISSION_GUIDE.md for submission. Prepared browsers explicitly activate offline updates; saved research is retained.

Logo geometry is preserved and Mars is independent of the illustrative lunar orbit. Full field-study JSON retains the complete saved model/book; compact QR has a narrower stated scope. Scientific limitations (coarse terrain, mapped geology, model polar resources) remain explicit. No new dependency or API key was needed. Firefox/Safari/formal accessibility certification and hosted CI results are not claimed.
