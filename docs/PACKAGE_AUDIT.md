# Packages A, B and C — repository audit and completion plan

Audit base: `0f326ff`, pulled with a clean fast-forward from `efa7194` (11 teammate commits). The original package definitions were recovered from the approved planning conversation, rather than inferred from the latest checkpoint. Baseline:76 Python tests,86 TypeScript tests and production build pass. Publication remains the older Release2; implementation status is not deployment status.

| Package | Approved scope | Audit finding before this repair pass |
|---|---|---|
| A: demo and evidence | Immutable snapshots, Evidence Inspector, focused cases, navigation/presentation, offline preparation, validated public release | Implemented and previously tested; new routes need regression/offline checks. Latest code has not been publicly deployed. |
| B: scientific upgrade | Common-support pilot and validated expansion, mission-aware discovery, Field Study Builder | Real two-site/40-scenario pilot exists;130-cell search and field builder were added. Partial: new environmental fields lack tests/retained public unit metadata; some proxy labels overclaim. Field-study share/reopen/model and newly screened-cell workflows need integration checks. Wider common-support coverage is an explicit future research expansion, not a fabricated completion. |
| C: lunar base extension | Verified polar reference and associated pipeline | Real LOLA eight-feature reference and streamed Diviner records exist. Partial: source-published Diviner checksum not checked, thermal/ice semantics and unknown codes need stronger handling, site deep links missing, challenge-fit page still says Diviner unavailable. No landing-region polygons, illumination model or measured ice inventory exists. |

## Findings requiring implementation

- AOD550 is column aerosol optical depth, not measured surface dust loading or dust composition. GBIF occurrence density measures recorded observations and sampling effort, not life scarcity, sterility or habitability. Percentiles within130 cells are relative descriptors, not increasing Moon/Mars similarity.
- POWER monthly mean daily minima/maxima are climatological air-temperature statistics. They must not be presented as absolute observed extremes or equivalent to lunar surface thermal products. GWET is a model wetness index, not measured ice/permafrost.
- New climate values lose units, period and per-variable provenance in the public payload. Source citations must remain attached to values, not only a distant undifferentiated list.
- Diviner is a model-derived thermal/ice-stability product, not a detection of ice. Validate label column locations, checksum, units, missing/special values and spatial support. Unknown−1 ice codes must be visible. Triangle counts and area fractions must be distinguished.
- Field-study export/reopen/share must preserve the exact model/release/candidate origin. A shared link should request its pinned release automatically; damaged or missing science must stop replay. Proposed field stations remain distinct from observations.
- The historical Artemis2024 feature list must be identified by its source date, not silently asserted to be the current mission landing plan. Feature centres are not landing polygons.
- Status/plan/challenge pages contain stale or contradictory completion claims. Submission deadline/video rules require primary event confirmation and must not be treated as verified from an inaccessible page.

## Implementation milestones

1. **R1 scientific contracts and provenance**: correct environmental/biology/subsurface interpretation; retain units/periods; validate and independently verify Diviner; area-aware thermal summaries and missing-code handling; add scientific regression tests; rebuild new immutable science release. Preserve historical releases and original130-cell baseline.
2. **R2 complete research workflows**: field-study replay/model/release integrity, cell-to-study support, lunar site deep links, consistent mission/candidate context, null/empty-state handling and exports. Add meaningful unit/browser coverage.
3. **R3 full product QA**: all routes/actions, new guided-demo chapters, offline new routes and corruption rollback, desktop/mobile/tablet layout, keyboard/dialog accessibility and production CI. Repair observed regressions without rebuilding the app.
4. **R4 release and human handoff**: reconcile A/B/C matrix with actual evidence, refresh science/source/status docs, deployment and submission guides, prepare submission text and short/long demo scripts; commit/build/package, deploy to the existing public ChatGPT Site, verify fresh audience sessions and record exact version/commit/rollback.

After every completed milestone: relevant tests, status notes, commit, push and remote SHA verification. Deployment is authorized by the user's latest instruction. Video recording, team details, submission/terms and other human actions remain with the user. No actual challenge submission will be made.

Optional research, not release acceptance: global exhaustive search, new SAR/JAXA/Diviner-illumination products, field validation, high-latitude Earth DEMs and common-support analysis beyond the current two-site feasibility pilot. These require independently validated data and must stay explicitly unavailable until implemented.

## Repair results (current software)

| Package | Result after audit | Explicit boundary |
|---|---|---|
| A | Software checks complete: exact historical replay, evidence/cases, navigation, isolated presentation and offline new routes. Public publication is the final release step; DEPLOYMENT.md records its result. | External maps/citations need internet; browser caches can be evicted. |
| B | Implemented: two-site common-support feasibility pilot,130-cell mission-aware expansion, six ranking lenses and real-cell Field Study Builder with saved-model export/replay. | Common-support analysis remains a two-site pilot; larger/global search and field validation are future research, not claimed complete. |
| C | Implemented bounded reference: eight source-verified LOLA feature profiles and independently verified Diviner thermal/stability summaries with area weighting, unknown-code handling and deep links. | No landing polygons, illumination-engineering model, high-latitude Earth terrain campaign, measured ice abundance or confirmed base suitability. These remain unassessed. |

Fixed in9382a55: environmental units/provenance, unsupported proxy interpretations, land gate, area-weighted polar statistics and stale challenge claims. Independently verified in db039a9:604,800,210 source bytes; PDS MD5 match; all30,674 retained records exact. Completed in b6c807d: expanded cell-to-field workflow, saved-model/full-link replay, compact-QR scope, damaged-link refusal and polar deep links. Verified in41ed530:81 Python/89 TypeScript/38 production browser tests,85 responsive route/width cases, modal focus/keyboard repairs and offline new tools. CI browser checks are configured; local results do not assert the hosted CI result.

No software gate is intentionally left at the teammate's midway checkpoint. Scientific unknowns remain unknown. The original draft's broader optional research should not be described as completed by a working interface. Final public verification and human actions are recorded separately in the deployment/submission guides.
