# Submit TerrainX — step by step

The app and supporting software are prepared. You handle the video/slides, team details and actual submission. The public project link is https://terrainx-discovery-lab.comfybay1.chatgpt.site; confirm the latest successful version in [DEPLOYMENT.md](../DEPLOYMENT.md).

## Confirm the deadline and format

1. Sign into the official Space Apps account yourself. Open your team and its Project tab; confirm its challenge, event and deadline. The 2026 event page lists **15 November 2026, 23:59 local time**; the organizing team says the timezone follows the team owner's Local Event. Check earlier local judging requirements too. Do not infer it solely from the computer's Riyadh timezone. [Event page](https://www.spaceappschallenge.org/2026/), [organizing-team answer](https://github.com/nasa/spaceapps/discussions/1916).
2. Prepare one short demo: aim for a 29-second video, or use no more than 7 slides including title and closing. Keep the project page in English; use English subtitles if narration is in another language. The longer in-app guided demo is supplementary. [NASA-hosted format answer](https://github.com/nasa/spaceapps/discussions/1991), [official guide](https://www.spaceappschallenge.org/resources/project-submission-guide/). Direct guide retrieval intermittently returned502; the current portal instructions govern.
3. Upload the demo to your chosen host. Test both demo and app links in a fresh incognito window, signed out. Neither should ask judges to request access. Avoid an expiring preview URL.

## Record a 29-second demonstration

Research tools → Offline first, then open these screens in advance. Use your original TerrainX logo, real data and readable captures. Do not include unverified output, access tokens or account screens.

| Time | Screen | Suggested narration |
|---|---|---|
|0–5s|Landing|“TerrainX finds where on Earth to rehearse Moon and Mars field science.”|
|5–10s|Judge path · sample|“We characterize 130 NASA observation cells for specific mission questions.”|
|10–16s|Judge path · lead|“Terrain fidelity, experiment utility and evidence coverage remain separate.”|
|16–23s|Judge path · evidence|“Published samples reveal mixed volcanic materials, showing where the analogy needs testing.”|
|23–29s|Judge path · experiment|“Turn that gap into a reproducible field proposal and the next measurement.”|

Open `/#/guide?cohort=expanded&polar=none` and use Next to move through the five steps. The Moon case is a scoped volcanic-material investigation; the Mars alternative preserves an unresolved local evidence gap. Choose “Prepare this field proposal,” suggest a relief transect and show the proposal label. The separate polar workflow and 360-comparison support study are useful for audience questions, rather than the required short clip. Advanced pages are under Research tools.

Slide alternative: 1 title/team; 2 challenge; 3 NASA/partner data; 4 F/U/C and missing evidence; 5 bounded 130-cell findings; 6 polar model limitations; 7 proposed field experiment/public link. Count every title/closing slide.

## Fill the Project tab

Use [SUBMISSION.md](../SUBMISSION.md) as draft copy, then add your team's actual details and demo URL. Typical fields are project title, summary, final-project URL, demo URL, detailed description, NASA/partner/other sources, tools and AI use. Confirm the live form rather than assuming field names or character limits.

- Title: **TerrainX — Planetary Analog Discovery & Mission Readiness Lab**.
- Final project: the public ChatGPT Site URL above. The source repository is private; the public app is the accessible final artifact. Follow any additional local source-sharing requirement.
- Demo: your tested short video or slide link; never the 29-second script document alone.
- Sources: NASA POWER, SRTM via OpenTopoData, PDS MOLA/LOLA/Diviner, NASA GIBS and NASA reference imagery; Copernicus GLO90; Macrostrat; GBIF; Natural Earth. Detailed citations and limitations are in DATA_SOURCES.md and the app.
- AI disclosure draft: “OpenAI Codex assisted software implementation, numerical routines, debugging, tests and documentation. A teammate's AI agent also assisted development and preprocessing. Scientific values originate from cited source products or explicit calculations; synthetic fixtures are limited to tests. The team reviewed the scientific interpretation.” Add other tools/models actually used; do not invent them.
- Keep the no-endorsement statement and the distinction between observations, derived metrics, model assumptions and unknowns.

Read the terms yourself and submit. Retain the portal confirmation and the submitted app/source version. If the portal permits edits, follow its rules; do not assume either editability or irreversibility without checking.

## Final checks you perform

Confirm names/roles, challenge selection, owner-event timezone, short-demo duration/slide count, English/subtitles, public links, actual tool disclosures and acknowledgements. Record the submitted commit and URLs after final submission; an optional submission tag should identify that exact version. No field campaign, mineralogical confirmation, measured lunar ice, rover safety certification or NASA approval is claimed.
