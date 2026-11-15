# TerrainX quality assurance

## Environment

Windows, Node 24.x, Python 3.12 and installed Chrome through Playwright. Production preview: http://127.0.0.1:4173/. The Browser plugin is not available in this session; the repository's existing Playwright workflow is used.

The primary flow is: landing → Discovery → select a site and mission → inspect evidence → create/export a field study. Additional coverage includes expanded cells, polar references, historical releases, model persistence, all Research Lab protocols, the pitch deck, provider failure and offline corruption recovery.

## Checks

| Check | Result |
|---|---|
| Scientific tests and independent baseline reproduction | 94 passed |
| Frontend numerical/schema/protocol tests | 117 passed |
| Strict TypeScript and static production build | Passed |
| Complete production browser suite with live providers | 55 passed |
| Desktop/mobile/short-laptop route and screenshot review | 96 passed at 1568×1003, 390×844 and 1280×720 |
| Fresh public deployment acceptance | Pending publication |

Commands: `.venv\Scripts\python.exe scripts\validate_results.py`, `npm run test:unit`, `npm run build`, and `npm test` with `TERRAINX_BASE_URL` set to the preview or production URL.

All eight Research Lab tools exported valid JSON reports and opened their matching field protocols. Route checks verified page identity, meaningful content, no framework overlay, no application/console errors, intact images and no document overflow. Desktop atlas, phone polar evidence and lunar-base screenshots were visually inspected.

## Verification limits

Browser checks use Chrome with desktop and mobile-sized viewports. Firefox, Safari, physical-device performance, field operations and formal accessibility certification are untested. External map/imagery providers are best-effort services; the core science has cached inputs and explicit unavailable states. Local test success does not establish a hosted CI result.

Exact published version/source and rollback details: [../DEPLOYMENT.md](../DEPLOYMENT.md).
