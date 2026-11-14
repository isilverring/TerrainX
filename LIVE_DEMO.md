# TerrainX audience demo and deployment

The audience URL is **https://terrainx-discovery-lab.comfybay1.chatgpt.site**. Public access has been requested by the owner; the verified deployment and access result are recorded in DEPLOYMENT.md. The source repository remains private. No NASA, tile or LLM API key is required.

## Present the deployed demo

1. Open the audience URL in a private/incognito browser window. Confirm the TerrainX landing page appears without sign-in. If access is still pending, consult DEPLOYMENT.md before sharing the link.
2. Use a desktop browser at 100% zoom. Fullscreen with F11 if useful. The app is also usable on a phone.
3. Open **What if** and click **Reset to release defaults** for each mission if this browser was used to experiment with settings. Changes persist across views and reloads.
4. Return home and select **Guided demo**, or open `/#/demo`. Use Next/Previous or arrow keys; Esc exits. Scenes advance manually so the presenter controls the pace.
5. Follow DEMO.md: show the real search, separate F/U/C, a missing-geology candidate in Frontier, Transfer Lab assumptions, measured Forensics, then Passport/Expedition Packet.
6. Print/Save as PDF from the Passport. JSON/CSV/GeoJSON export the active model and actual candidate values. The QR code preserves the model snapshot.
7. Before presenting, open Worlds and the chosen dossier once. The NASA comparison images and scientific data ship with the app; live basemaps, GIBS and optional AWS context terrain still depend on internet. If they fail, the local coastline, cached 24 km lattice and science views remain available.

## Run a local production fallback

Install Node 22.12+ (Node 24 recommended). In PowerShell:

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
3. Use the committed `netlify.toml`: base directory **frontend**, build command **npm ci && npm run build**, publish directory **dist**, Node **22** (latest 22.x).
4. Deploy. No environment variables or API keys are needed. Netlify publishes the built frontend, not the private repository history.
5. Open the resulting URL in incognito and click Discovery, Frontier, Transfer Lab and Guided demo. Test a direct `/#/passport/...` link, JSON export and Print. Share that public URL.
6. Future pushes to `main` trigger the connected deployment. Keep the last successful deployment until the new build passes.

One-off alternative: build locally as above, open Netlify's manual deploy/drop interface and drag **D:\TerrainX\dist** into it. Manual deployment uploads the already-built assets; it does not run a build.

Official instructions: [Import from Git](https://docs.netlify.com/start/quickstarts/deploy-from-repository/), [build settings](https://docs.netlify.com/build/configure-builds/overview/), [manual deployment](https://docs.netlify.com/deploy/create-deploys/).

## Vercel alternative

Import the private GitHub repository as a new project. Keep the root directory at the repository root, choose **Other** for framework, and use the committed `vercel.json`: install `npm --prefix frontend ci`, build `npm run build`, output `dist`. Select Node 22.x or 24.x. Deploy, check that audience protection permits your intended visitors, and verify the link in incognito. Hash routes need no rewrite rules. See [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build).

## Scientific demo guardrails

The 130 cells and 16 automatic candidates are real screening results; four benchmarks are separate. Ten automatic candidates support preliminary hypotheses under default weights. None is field-validated. No automatic lunar-basalt match is established. Frontier endpoints are hypothetical bounds, physics sliders are scenarios, and rank stability is model sensitivity. Show coverage alongside utility. Do not describe scores as success probabilities or NASA certification.
