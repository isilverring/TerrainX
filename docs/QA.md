# TerrainX quality assurance

## Score readability and pitch review

Discovery-story F/U/C/P labels are 20 px with visible meanings and 24–28 px values. Compact atlas/dossier labels, cell-score headings, coordinates, notes and Research Lab captions have larger type. Mobile forms use 16 px text and key controls have 44 px touch targets. The comparison page no longer reserves a desktop-sized blank area above its phone controls. Narrow cell-map controls wrap within the viewport.

Pitch slides keep the header/navigation visible while longer content scrolls. A scroll hint identifies additional content. Equations wrap within their panels; utility and coverage have distinct expressions. Diagram labels, score notes and presentation controls are larger. The workflow uses a compact phone grid, and reduced-motion settings apply to feature/equation animations. All ten slides retain their original figures and scientific inputs.

Current verification: 117 frontend unit tests, strict TypeScript/static build, **56 production browser workflows**, 96 broad route/viewport cases, 32 focused readability cases (including 320 px phones), three score/mission/form interaction cases and **40 pitch-slide/viewport cases**. The new browser regression verifies scroll access to the last feature and QR, complete equations, and visible navigation in phone portrait and landscape. Screenshots were visually reviewed. Public acceptance is recorded in DEPLOYMENT.md after publication.

## Environment

Windows, Node 24.x, Python 3.12 and installed Chrome through Playwright. Production preview: http://127.0.0.1:4173/. The Browser plugin is not available in this session; the repository's existing Playwright workflow is used.

The primary flow is: landing → Discovery → select a site and mission → inspect evidence → create/export a field study. Additional coverage includes expanded cells, polar references, historical releases, model persistence, all Research Lab protocols, the pitch deck, provider failure and offline corruption recovery.

## Checks

| Check | Result |
|---|---|
| Scientific tests and independent baseline reproduction | 94 passed |
| Frontend numerical/schema/protocol tests | 117 passed |
| Strict TypeScript and static production build | Passed |
| Complete production browser suite with live providers | 56 passed |
| Desktop/mobile/short-laptop route and screenshot review | 96 passed at 1568×1003, 390×844 and 1280×720 |
| Fresh public deployment acceptance | 55 passed on version 9; three focused public screenshots passed |

Commands: `.venv\Scripts\python.exe scripts\validate_results.py`, `npm run test:unit`, `npm run build`, and `npm test` with `TERRAINX_BASE_URL` set to the preview or production URL.

All eight Research Lab tools exported valid JSON reports and opened their matching field protocols. Route checks verified page identity, meaningful content, no framework overlay, no application/console errors, intact images and no document overflow. Desktop atlas, phone polar evidence and lunar-base screenshots were visually inspected.

## Verification limits

Browser checks use Chrome with desktop and mobile-sized viewports. Firefox, Safari, physical-device performance, field operations and formal accessibility certification are untested. External map/imagery providers are best-effort services; the core science has cached inputs and explicit unavailable states. Hosted CI status was unavailable through the connected GitHub account; local test success does not establish a hosted CI result.

Exact published version/source and rollback details: [../DEPLOYMENT.md](../DEPLOYMENT.md).

Public acceptance used fresh unauthenticated Chrome sessions at https://terrainx-discovery-lab.comfybay1.chatgpt.site. Its build metadata identifies `b94533c6276c5ceb2ef9bb78205da440c4885195` and `science-e15ca0c149550211`. The public atlas and phone polar-source screenshots were visually inspected.
