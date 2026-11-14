# Release 3 implementation checkpoints

Approved scope: Package A (versioned research, Evidence Inspector and case studies, clearer navigation/presentation, offline preparation and validated public release), then the comparable-terrain pilot. The lunar-polar extension remains optional. All work stays D:\TerrainX.

## Milestones
- Completed M1: immutable science releases and research snapshot save/export/import/replay. Historical release failure is explicit; no newest-data substitution. Packets and QR links carry release/model/hash. Frozen release bytes bypass Git newline conversion. Checks:63 existing Python tests,56 TypeScript tests, production build; existing browser flows plus snapshot replay/missing-release checks pass after fixing a navigation pinning race and static-host HTML fallback handling.
- Pending M2: Evidence Inspector and source-scoped Saudi/Chile/Salda case studies.
- Pending M3: Discover / Investigate / Prepare navigation, isolated presentation session and accessible controls.
- Pending M4: first-party offline demo preparation, atomic cache updates and offline acceptance tests.
- Pending M5: comparable-scale pilot using verified public Copernicus GLO90 DSM and real MOLA/LOLA, separately labeled from original SRTM scores. Actual NASA SRTM dense download requires Earthdata login; partner source is available without keys.
- Pending final: regression/production checks, updated demo/submission materials, public deployment and exact recovery notes.

Resume: read newest STATUS.md checkpoint, git status/log, then run npm run test:unit and npm run build with Node24. User requires documentation, commit and verified push after each completed milestone. No paid API/backend required. Missing data remains null; no field results are invented.
