# TerrainX — plan to submission and beyond

Written 2026-11-14 (laptop session) after re-reading the live challenge page, its Resources tab and the Space Apps submission rules. Current build: `main`, science release `science-1407d3729d4bd714`.

## Deadline and hard requirements

- **Submission closes Sunday 15 November 2026, 23:59 local time** (project tab on the team page; opens Saturday 09:00). Submission is final; no edits afterwards.
- **Project demo is mandatory**: a video of **≤ 30 seconds** (English subtitles if spoken in another language) **or** a slide deck of **≤ 7 slides** including the title slide. Exceeding either limit makes the project ineligible for Global Judging.
- Demo must be hosted externally (YouTube, Drive, GitHub…) with a **public** link; it cannot be uploaded to the Space Apps site.
- Project page and linked materials in **English**; tick the Terms & Conditions box.
- The private GitHub repo is fine as long as the **public app URL** and demo link work for judges.

## What the challenge asks vs what TerrainX has (summary of `/challenge`)

| Challenge dimension | Status | Notes |
|---|---|---|
| Terrain, slope, roughness, craters | Covered | SRTM all 130 cells; MOLA/LOLA; Copernicus pilot; LOLA south pole |
| Look beyond well-known analogs | Covered | Systematic 130-cell, mission-aware search; first lunar-eligible mapped-basalt cell |
| Explain what is / isn't analogous | Covered | F/U/C split, Reality Gap, evidence inspector, Earth's limits |
| Earth's limits (gravity, vacuum, radiation) | Covered | Transfer Lab, dossiers, demo |
| Geology and surface materials | Partial | Macrostrat mapped units, no mineralogy |
| Temperature, illumination, extremes | Partial | POWER for candidates only; **no Diviner yet** (explicitly listed in Resources) |
| Dust, wind, atmospheric processes | Partial | POWER wind/pressure; no dust data |
| Landing, mobility, operations | Partial | Operations lens, Froude, field-study traverses |
| Permanent Moon-base locations | Partial | LOLA at Artemis III region features; no illumination / cold traps |
| Water, ice, permafrost, resources | Gap | |
| Biology, habitability, biosignatures | Gap | cited references only |
| Caves, lava tubes, subsurface | Gap | |

Resources tab data in use: NASA POWER (Earthdata), GIBS/Worldview imagery, PDS (MOLA, LOLA), LRO LOLA, ESA Copernicus DEM. Not yet used: **LRO Diviner**, CSA RADARSAT, JAXA G-Portal.

## P0 — must finish before the deadline (≈ 6–8 hours of work)

1. **Deploy and verify the public app** (1 h). Vercel per [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md) and/or update the existing public Site from the PC (never create a new Site). Open every route in incognito; run `TERRAINX_BASE_URL=<url> npx playwright test`.
2. **Record the 30-second demo** (2 h). Use the in-app guided demo (`/#/demo?presentation=1`) as the backdrop; capture at 1920×1080; burn in English subtitles; upload unlisted to YouTube or attach to a GitHub release. Draft script (≈ 75 words):
   - 0–5 s: "We're <team>. TerrainX finds where on Earth to rehearse for the Moon and Mars." (landing globe)
   - 5–12 s: "We screened 130 NASA POWER cells and gave every one real SRTM terrain and Macrostrat geology." (`/cells`)
   - 12–18 s: "Searching for the mission, not just dryness, changes 11 of 13 picks — and finds the first lunar-eligible basalt cell, in Chile." (Moon callout)
   - 18–24 s: "At the lunar south pole, checksum-verified LOLA terrain shows where Earth twins exist — and where none do." (`/lunar-pole`)
   - 24–30 s: "Every score shows what matches, what doesn't, and the field test to run next." (Field Study Builder / field book)
   - Alternative: 7-slide deck (title · problem · data · method F/U/C · 130-cell finding · lunar pole · field study & limits).
3. **Write the project page** (1 h). Summary, how NASA/space-agency data were used (list from `/challenge`), app link, demo link, repo note, limitations, team. Draft from README "Working experience" + this file.
4. **Final QA on the deployed URL** (1 h): phone layout, offline preparation, demo keyboard controls, no console errors.
5. **Freeze**: tag the submitted commit (`git tag space-apps-2026-submission`), record URL + commit in `DEPLOYMENT.md`.

## P1 — high value, feasible if time remains (each 2–4 h)

6. **Diviner polar temperatures** on `/lunar-pole` (named in the Resources tab for exactly this). Pick one pinned Diviner polar product (e.g. a summer maximum-temperature map), fetch through the laptop browser, pin its SHA-256 like LDEM_16, sample at the eight IAU centres, and show "Earth cannot reach this cold" next to each site. Only with a verifiable product.
7. **Point T2M for all cells** (POWER point API, 114 requests via the same browser route) so cell coverage reaches 100% and cell P equals the released model's P.
8. **GIBS/Worldview context per cell**: dated true-colour tile for the selected cell on `/cells` (the Explorer already handles GIBS).
9. **Shareable deep links** from `/cells` and `/lunar-pole` (selected cell / site in the URL) for the demo and judges.

## P2 — after the hackathon

10. **Global search**: extend beyond four regions (challenge: "explore the whole Earth"), batching POWER regional + SRTM + Macrostrat through the cached pipeline.
11. **Fill the gaps**: ice/permafrost (e.g. snow/ice products), caves/lava tubes (published inventories), dust/aerosol (MERRA-2 / MODIS AOD), biology references.
12. **CSA RADARSAT / ESA Sentinel-1 SAR** roughness for surface texture; **JAXA G-Portal** precipitation cross-check.
13. Field Study Builder for screened cells; illumination modelling at polar sites; expand the Copernicus common-support pilot beyond two sites.
14. Engineering: split large JS chunks (map, charts), shorten header navigation (group into menus), full accessibility audit (axe), CI running pytest + vitest + Playwright on each push.

## Guardrails that stay

Genuine, source-linked data only; missing evidence stays null; frozen science releases are never edited; no claims of field validation, NASA approval, or confirmed lithology at a subsite.
