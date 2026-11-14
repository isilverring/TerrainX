# Resume TerrainX

Keep all work in **D:\TerrainX**. Private GitHub repository: isilverring/TerrainX, branch main. Public audience Site: https://terrainx-discovery-lab.comfybay1.chatgpt.site. Preserve its Site ID and public audience; never create a duplicate.

1. Read STATUS.md, DEPLOYMENT.md and docs/RELEASE_3.md. Release3 implementation is complete; use DEPLOYMENT.md to verify exact publication status.
2. Run git status --short --branch and git log -6 --oneline. Pull --ff-only only when clean. Never discard someone else's uncommitted work.
3. Use Node22.12+ (Node24 recommended). npm --prefix frontend ci; npm run dev serves127.0.0.1:5173.
4. Python3.12: install requirements-lock.txt in .venv. scripts/validate_results.py runs67 tests plus independent reproduction. npm run test:unit runs61 tests.
5. npm run build; npm run preview serves127.0.0.1:4173. Set TERRAINX_BASE_URL=http://127.0.0.1:4173 and run npm test for all24 production-preview workflows, including verified offline preparation. Browser plugin not available in the implementation session, so installed Chrome/Playwright was used.
6. For scientific refresh use build_planetary_profiles.py, build_planetary_context.py and build_discovery.py --offline as appropriate. build_terrain_pilot.py downloads missing checksum-pinned public Copernicus inputs and derives the separate pilot. Full rasters are ignored and must be downloaded on a new machine. Never substitute synthetic arrays.
7. Keep all frozen frontend/public/releases folders. Dataset/snapshots/links pin their science ID/hash/model; historical missing assets must stop replay. Model equation changes require versioning. The pilot has its own terrainx-support-pilot-v1 contract.
8. After each completed milestone, update status and run scripts/checkpoint.ps1 -Message "describe the milestone". It stages, commits, pushes and verifies GitHub HEAD. Credentials stay in memory only.

The original logo geometry is preserved with silver/cyan contrast. Mars is independent of the illustrative lunar orbit. Presentation settings are temporary and do not overwrite research models. Offline preparation is opt-in, verifies every first-party response and preserves the last complete cache on failed updates; external tiles/citations remain online-only.

Optional future work: field validation/mineralogy, a proposed field-study planner, a separate mission-aware regional search experiment, or a separately sourced lunar-polar/Diviner module. These are not claimed as implemented or field-verified. Broadening the pilot beyond two Earth sites is also future work.
