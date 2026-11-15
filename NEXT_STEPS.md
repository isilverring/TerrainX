# Development and release guide

## Start a development session

Read [STATUS.md](STATUS.md), [DATA_STATUS.md](DATA_STATUS.md) and [DEPLOYMENT.md](DEPLOYMENT.md). Inspect `git status` and `git log`; pull with `git pull --ff-only` when the working tree is clean. The primary Windows checkout is `D:\TerrainX`.

Use Node 24.x/Python 3.12. Install frontend dependencies with `npm --prefix frontend ci` when needed. Run `npm run dev` for http://127.0.0.1:5173/.

## Validate changes

```powershell
.\.venv\Scripts\python.exe scripts\validate_results.py
npm run test:unit
npm run build
npm run preview
```

In another terminal:

```powershell
$env:TERRAINX_BASE_URL='http://127.0.0.1:4173'
npm test
```

Use live network for provider acceptance. Set `TERRAINX_OFFLINE=1` only for an explicitly offline run. Scientific validation can rewrite identical JSON with different line endings; review substantive changes before committing generated files.

## Preserve research contracts

- Historical science releases are immutable. New scientific inputs produce a new release.
- Original study and Expanded search are separate collections. Saved studies retain their declared release, model, collection, mission, polar reference and protocol.
- Missing evidence stays unavailable. Source-scoped references and scenarios do not become local observations.
- Retain successful source responses, labels, licences, hashes and extracted profiles. Large raster/kernel binaries remain reproducibly downloadable.

Commit reviewed changes, push `main` and verify the remote SHA. `scripts/checkpoint.ps1` supports this sequence. Rebuild after the final runtime commit so `build-info.json` identifies the published source. Follow [the hosting guide](docs/DEPLOY_CHATGPT_SITE.md) for packaging and publishing to the existing Site.

## Prepare the submission

Rehearse with [LIVE_DEMO.md](LIVE_DEMO.md), choose the short video or slide selection described in [docs/SUBMISSION_GUIDE.md](docs/SUBMISSION_GUIDE.md), and test public links while signed out. Team details, required tool acknowledgements, terms and event submission are completed through the official portal. Field validation and additional scientific research have their own evidence requirements.
