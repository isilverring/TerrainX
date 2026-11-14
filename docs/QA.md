# TerrainX verification and visual review

## Environment and target flow

Browser plugin/skill was not available in this session; regular Playwright used installed Google Chrome. Development URL:http://127.0.0.1:5173/. Production preview:http://127.0.0.1:4173/. Desktop1568×1003 matches the concept dimensions; mobile390×844.

Flow under test:landing→Launch Discovery→Mars/Moon mission→region/evidence filters→candidate selection→Analog DNA→Reality Gap→Analog Passport→print/PDF→Methodology. Model controls also update normalized weights and coverage. Failure tests block external basemap requests and confirm local coastlines/markers and cached science remain accessible.

## Recorded checks

| Check | Result |
|---|---|
| Scientific tests |48 passed; actual periods/units, PDS labels, numerical terrain, scale/missing-data gates, utility, provenance and deterministic discovery|
| Independent result reproduction |All saved shortlist, terrain, F/U/C and eligible P recomputed successfully|
| Strict TypeScript and static build |Passed; Vite static assets include the explicitly bundled MapLibre module worker|
| Dependency audit |0 known vulnerabilities with installed lockfile|
| Development browser workflows |4 passed; zero page/runtime or console errors in the successful main workflow|
| Page identity / blank check |TerrainX title and meaningful content present|
| Framework error overlays |None in final run|
| Map |Real public Esri dark-gray Base/Reference, all20 markers, real screened cells, source attribution, selection/fly-to and zoom controls|
| NASA imagery |Verified dated GIBS tile request returned200 in the actual interactive workflow|
| Mobile |No horizontal overflow; mission drawer, planet selector, map and results work|
| Weights |Geology weight0.70 visibly changes unknown-geology coverage to30%; reset restores defaults|
| Print |Analog Passport rendered in print media and exported successfully through Chromium PDF|
| Failure states |Blocked basemap still has local Natural Earth coastlines,20 markers, and cached data; no invented observations|

Production-bundle verification also passed all 4 workflows against http://127.0.0.1:4173/ (16.1s), including the real bundled MapLibre worker, live basemap/GIBS, and local fallback. Live tiles are best-effort services; core scientific inputs are cached.

## Concept-to-render fidelity ledger

Accepted references:`docs/design/landing-concept.png`,`docs/design/explorer-concept.png`, with tokens/copy in DESIGN.md. Built-in Image Gen produced UI references; no generated map is used as scientific evidence. Both concepts and latest rendered screenshots were inspected directly with `view_image` at the same desktop size.

| Comparison point | Observed result and fix / intentional difference |
|---|---|
| Landing copy and hierarchy |Exact required headline, description, Launch Discovery Engine CTA, and Discover/Compare/Explain/Prepare band retained. Increased title/CTA/process typography after direct comparison. No extra hero eyebrow or invented result count.|
| Workspace layout |Three-panel mission/map/results anatomy, thin borders, teal selected strip, open candidate rows and bottom evidence/actions match the concept. Adjusted desktop proportions to22%/remaining/30%.|
| Typography |Self-hosted Space Grotesk, Inter, JetBrains Mono; readable controlled title/body/number scales. Labels, rows, tables and mobile controls reviewed.|
| Palette and containers |Exact requested navy/surface/border/teal/coral/moon tokens; restrained6–8px radii and1px dividers. No generic bento grid.|
| Geographic asset treatment |Real Natural Earth globe/coastlines and real basemap replace generated concept geography. Public Esri neutral-gray imagery differs from concept blue land tones because source fidelity and key-free access take priority over a fabricated map.|
| Data hierarchy |Real candidate identities/counts/F/U/C replace concept em dashes. Partial evidence and separate benchmarks require additional explanatory rows; these are intentional scientific-content differences.|
| Icons and interaction |Lucide outline controls; Mars circle, Moon selector; map controls, filters, weight sliders, links and print action function. Removed a non-reference header icon and extra header slogan.|
| Responsive behavior |Mobile mission drawer, map-first layout and lower results sheet; no horizontal overflow at390px. Longer source URLs/tables have appropriate wrapping/scrolling.|
| Motion and accessibility |Reduced-motion-aware fly-to and scrolling; native labelled controls, visible focus states, accessible chart table and text/status cues beyond color.|

Above-the-fold copy diff:required landing copy and navigation preserved. Intentional Explorer additions are actual source status, candidate identities/evidence, layer controls and model assumptions requested by the scientific workflow. There are no fictional results or placeholder scientific controls.

Material issues corrected during QA:point-climatology period field mismatch; map CSS zero-height clipping; remote-tile-dependent overlay readiness; MapLibre6 module-worker URL packaging; provider key-required watermark tiles; mobile decorative overflow; missing favicon. The shipped map uses no user API key. No material layout or interaction blocker remains in the final development run; production verification follows the same workflow.

## Evidence

Curated renders:`docs/screenshots/landing-desktop.png`,`explorer-desktop.png`,`explorer-mobile.png`. Original concepts remain under `docs/design/`. These show genuine data/real geography; concepts are explicitly marked design references. Temporary browser/test outputs are ignored under `artifacts/qa/`.

## Limits of verification

Chrome desktop/mobile-sized viewports were tested; Safari, Firefox, physical phones, screen-reader sessions and real field operations were not. The app is static and has no application account system. The linked Sites preview remains owner-private unless the user explicitly changes its audience. Scientific limitations are in SCIENCE.md and every dossier.
