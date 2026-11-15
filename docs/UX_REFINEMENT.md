# TerrainX usability refinement — 2026-11-15

This is a new follow-up scope. The six items in CHALLENGE_COMPLETION.md remain completed. Work on main in D:\TerrainX; commit and push every completed milestone.

## Audit findings and work

- [x] U1 — Repair Discovery state: URL-backed filters/selection, back/forward replay, collection-safe comparison picks, unique comparison IDs, explicit unavailable selections and filter reset. Atlas-specific keys travel through dossiers without colliding with other workspace filters. Comparison edits retain collection/release/polar identity; Mars switching is disabled inside lunar-polar comparison.
- [ ] U2 — Refine the existing mission workspace: readable score meaning, a clear discover → inspect → prepare path, contextual next actions, accessible controls, working mobile results and selected-site access. Preserve the supplied logo, independent Mars illustration and actual scientific data.
- [ ] U3 — Verify complete research flows, desktop/mobile visuals and scientific contracts; production build; publish an update to the existing public Site. Update restart, deployment and demo notes with evidence.

## Boundaries

No new observations, winners, geological evidence or NASA claims are introduced. F/U/C, evidence gating, polar target identity, source protocol restrictions, frozen releases and original versus expanded collections stay intact. All visual data remain real cached observations or explicitly labeled calculations. Generated UI concepts are design references only and are never scientific assets.

## Restart checkpoint

Initial audit: source 8fe2ae6, clean and up to date. Public version 6 remains available while this work is in progress. Observed mobile issue: collection-shell fixed viewport height overrides the natural stacked layout and can squeeze the result rail. Observed state issues: in-memory filters disappear on remount; stored comparison IDs can be absent in the active collection; duplicate URL IDs are not deduplicated. Browser plugin is unavailable; existing Chrome/Playwright is the browser QA fallback.

U1 validation:99 Vitest tests, strict TypeScript compilation and3 new browser workflows pass. Initial test fixtures were corrected to wait for actual selected state and use the real reference-khaybar ID. No scientific inputs were changed. Next: U2 layout/content and mobile clipping, then complete production regression/deployment.

Next agent: inspect git status/log and STATUS.md before continuing. Update this file at each milestone. Do not treat completed earlier scope as unfinished.
