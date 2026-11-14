# Resume TerrainX

Task 1 is complete. Work only in `D:\TerrainX`. Do not restart from an empty scaffold.

1. Read STATUS.md,DATA_STATUS.md,SCIENCE.md and DEPLOYMENT.md.
2. Run `git status --short --branch` and `git log -5 --oneline`. Preserve any newer user changes.
3. The private preview is https://terrainx-discovery-lab.comfybay1.chatgpt.site . Use its existing `.openai/hosting.json` identity;do not create a duplicate.
4. Local app:`npm --prefix frontend ci` then `npm run dev` from root. The server is127.0.0.1:5173. Node22+ recommended.
5. Scientific checks:`.venv\Scripts\python.exe scripts\validate_results.py` (48 tests and result reproduction). Python3.12 is available via `py -3.12` on this workstation.
6. Rebuild data only when needed:`scripts/build_planetary_profiles.py`,then `scripts/build_discovery.py` (or `--offline` to use cached Earth requests). Successful caches are retained and downloads/writes are atomic.
7. Root `npm run build` prepares `dist/`. Browser tests:`npm test` while the dev server is running. Set `TERRAINX_BASE_URL=http://127.0.0.1:4173` for a running production preview. Four workflows currently pass.
8. After a future completed module:update status,next steps and scientific caveats;run relevant checks;use `scripts/checkpoint.ps1` to commit,push and verify GitHub.

No required MVP task remains. Optional future work should follow the user's next prompt:matched physical-support sensitivity analysis,field mineralogy/terrain validation,or carefully sourced Diviner/SAR/Sentinel/JAXA extensions. Do not add unverified measurements or infer geology from dryness. No API key is needed for the current release.
