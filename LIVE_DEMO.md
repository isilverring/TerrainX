# TerrainX audience demo and deployment

The audience URL is **https://terrainx-discovery-lab.comfybay1.chatgpt.site**. Public access and the reviewed production workflows are verified; exact deployment details are in DEPLOYMENT.md. The source repository remains private. No NASA, tile or LLM API key is required.

## Present the deployed demo

1. Open the audience URL in a private/incognito browser window. Confirm the TerrainX landing page appears without sign-in. If access is still pending, consult DEPLOYMENT.md before sharing the link.
2. Use a desktop browser at 100% zoom. Fullscreen with F11 if useful. The app is also usable on a phone.
3. Open **Research tools → Offline**, click **Prepare offline demo**, and wait for Offline ready. Reload and rehearse once with the network disabled. Reconnect for external maps/citations. Preparation is specific to this browser/device.
4. Return home and select **Guided demo**, or open `/#/demo`. Use Next/Previous or arrow keys; Esc exits. Scenes advance manually so the presenter controls the pace. Presentation starts with a temporary default model; its changes do not overwrite research settings. Exit restores the research model.
5. Follow DEMO.md: show the real search, separate F/U/C, a missing-geology candidate in Frontier, Transfer Lab assumptions, measured Forensics, then Passport/Expedition Packet.
6. Print/Save as PDF from the Passport. JSON/CSV/GeoJSON export the active model and actual candidate values. The Passport/Expedition QR preserves the scoring model snapshot. The separate compact Field Study QR preserves proposed station geometry with default models; use its full JSON for the complete field book.
7. Before presenting, check Offline ready and open Worlds, the Terrain pilot and the chosen dossier once. The NASA comparison images and scientific data ship with the app; live basemaps, GIBS and optional AWS context terrain still depend on internet. If they fail, the local coastline, cached 24 km lattice and science views remain available.

## Run a local production fallback

Discovery convenience: use **How to read F · U · C** to explain the scores. Search/region/evidence filters stay in the copied URL; **Reset filters** restores the list. On phones, use **Map / Results / Selected site** to jump between sections. From a selected site, follow **Inspect evidence → Prepare experiment**, or open the Passport. **Geology & climate context** expands the supporting summary. Field planning only offers candidates from the labeled collection; full shared plans pin their own context.

Install Node 24.x. In PowerShell:

```powershell
Set-Location D:\TerrainX
git pull --ff-only
npm --prefix frontend ci
npm run build
npm run preview
```

Open http://127.0.0.1:4173 and keep that terminal running. This tests the production bundle. After installation/build, cached science and bundled images need no NASA API requests. External maps still require network. Stop the preview with Ctrl+C when finished.

## Deploy your own public Netlify audience link

1. Sign into Netlify and choose **Add new project → Import an existing project**.
2. Select GitHub and grant access to the private `isilverring/TerrainX` repository. Select branch `main`.
3. Use the committed `netlify.toml`: base directory **frontend**, build command **npm ci && npm run build**, publish directory **dist**, Node **24** (24.x).
4. Deploy. No environment variables or API keys are needed. Netlify publishes the built frontend, not the private repository history.
5. Open the resulting URL in incognito and click Discovery, Frontier, Transfer Lab and Guided demo. Test a direct `/#/passport/...` link, JSON export and Print. Share that public URL.
6. Future pushes to `main` trigger the connected deployment. Keep the last successful deployment until the new build passes.

One-off alternative: build locally as above, open Netlify's manual deploy/drop interface and drag **D:\TerrainX\dist** into it. Manual deployment uploads the already-built assets; it does not run a build.

Official instructions: [Import from Git](https://docs.netlify.com/start/quickstarts/deploy-from-repository/), [build settings](https://docs.netlify.com/build/configure-builds/overview/), [manual deployment](https://docs.netlify.com/deploy/create-deploys/).

## Vercel alternative

Import the private GitHub repository as a new project. Keep the root directory at the repository root, choose **Other** for framework, and use the committed `vercel.json`: install `npm --prefix frontend ci`, build `npm run build`, output `dist`. Select Node 24.x. Deploy, check that audience protection permits your intended visitors, and verify the link in incognito. Hash routes need no rewrite rules. See [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build).

## Scientific demo guardrails

The 130 cells and 16 automatic candidates are real screening results; four benchmarks are separate. Ten automatic candidates support preliminary hypotheses under default weights. None is field-validated. No original-shortlist lunar-basalt match is established; the expanded search has one regionally mapped basalt lead requiring verification. Frontier endpoints are hypothetical bounds, physics sliders are scenarios, and rank stability is model sensitivity. Show coverage alongside utility. Do not describe scores as success probabilities or NASA certification.

## Audited release additions and submission

All cells → choose the Moon mapped-basalt lead → Plan a field study opens that cell's own observations. Full study JSON preserves all notes and settings; URL sharing preserves stations/intent/models; compact QR is geometry/default-model only. Lunar pole → select a feature; ?site= survives reload. PDS MD5 verification, model-derived thermal/stability semantics and unknown codes remain visible.

For audience use the eleven-scene guided narrative or DEMO.md. For the mandatory short event demo use docs/SUBMISSION_GUIDE.md (aim 29 seconds or at most 7 slides), then paste the reviewed SUBMISSION.md draft into your team page yourself. Team details, recording/upload, terms and actual submission are human actions.

Prepared old builds intentionally stay available until an explicit update. To upgrade: reconnect → Research tools → Offline → Prepare offline demo → Use prepared update and reload (if shown). Rehearse offline again. Do not clear saved research just to refresh assets. Exact release/source/rollback metadata is in DEPLOYMENT.md.

ChatGPT Site refresh/publication steps: [docs/DEPLOY_CHATGPT_SITE.md](docs/DEPLOY_CHATGPT_SITE.md).

## Six-item release rehearsal

Open /#/guide?cohort=expanded&polar=none and follow the five steps. Advanced pages are under Research tools. All Cells canonically selects the expanded collection; selecting Original study returns to its Explorer. Shared dossiers/snapshots carry cohort, mission, release and physical reference. Polar JSON/QR/field proposals preserve the selected feature; utility stays unassessed. A literature-informed protocol remains a proposal, with full JSON the complete transfer format.

The extended terrain study is under Research tools → Terrain pilot → Expanded18-site support study. It has360 valid comparisons and F-only order sensitivity; default processing ranges do not replace the active model's scores. Independent source cases and literature-informed field plans are in Cases. User video/team/terms/submission remain human actions. Refresh prepared browsers before presenting the updated build.
