# TerrainX usability refinement — 2026-11-15

This is a new follow-up scope. The six items in CHALLENGE_COMPLETION.md remain completed. Work on main in D:\TerrainX; commit and push every completed milestone.

## Audit findings and work

- [x] U1 — Repair Discovery state: URL-backed filters/selection, back/forward replay, collection-safe comparison picks, unique comparison IDs, explicit unavailable selections and filter reset. Atlas-specific keys travel through dossiers without colliding with other workspace filters. Comparison edits retain collection/release/polar identity; Mars switching is disabled inside lunar-polar comparison.
- [x] U2 — Refine the existing mission workspace: readable score meaning, a clear discover → inspect → prepare path, contextual next actions, accessible controls, working mobile results and selected-site access. Supplied logo, independent Mars illustration and actual scientific data preserved. More map space; collapsible data/geology context; score guide; result/filter count/reset; comparison clear controls; selected-site field action; sticky dossier section navigation.
- [ ] U3 — Verify complete research flows, desktop/mobile visuals and scientific contracts; production build; publish an update to the existing public Site. Update restart, deployment and demo notes with evidence.

## Boundaries

No new observations, winners, geological evidence or NASA claims are introduced. F/U/C, evidence gating, polar target identity, source protocol restrictions, frozen releases and original versus expanded collections stay intact. All visual data remain real cached observations or explicitly labeled calculations. Generated UI concepts are design references only and are never scientific assets.

## Restart checkpoint

Initial audit: source 8fe2ae6, clean and up to date. Public version 6 remains available while this work is in progress. Observed mobile issue: collection-shell fixed viewport height overrides the natural stacked layout and can squeeze the result rail. Observed state issues: in-memory filters disappear on remount; stored comparison IDs can be absent in the active collection; duplicate URL IDs are not deduplicated. Browser plugin is unavailable; existing Chrome/Playwright is the browser QA fallback.

U1 validation:99 Vitest tests, strict TypeScript compilation and3 new browser workflows pass. Initial test fixtures were corrected to wait for actual selected state and use the real reference-khaybar ID. No scientific inputs were changed. Next: U2 layout/content and mobile clipping, then complete production regression/deployment.

U2 additional findings repaired: planner candidate pools now respect the named collection instead of unconditionally merging expanded sites. Full shared plans restore/canonicalize collection, mission, polar reference and source protocol even without redundant query fields. Shared context controls are pinned; explicitly starting a separate plan remounts the editor. Dossier navigation from a field study carries its saved model. Expedition/model links preserve the science scope. Controlled filters update immediately while the URL transition completes (regression caught by checkbox interaction).

U2 checks:99 unit tests and strict TypeScript pass;19 focused browser flows pass, including historical field replay and polar/source proposals. Earlier20/21 broad workflows passed; the single checkbox transition failure was fixed and its full workflow then passed. U3 still requires one final unchanged production run and public publication.

## Design and visual review

Design reference: outputs/ux-workspace-concept.png (built-in Image Gen, design-only; not bundled into the app). Latest local rendered evidence: outputs/ux-review/explorer-1568.png and explorer-390.png, Chrome/Playwright. Concept and render both inspected with view_image at1568×1003; phone390×844 and intermediate820/1100 layouts checked. No Browser plugin is available.

| Comparison | Render decision / repair |
| --- | --- |
| Three-column atlas | Compact260px mission rail and400px inspector give the real map more room. Existing MapLibre controls and attribution preserved. |
| Brand and typography | Original orbital-X SVG, midnight/cyan/copper palette and Space Grotesk/Inter/JetBrains typography preserved. No new generated brand asset. |
| Workflow | Discover / Inspect evidence / Prepare experiment links added across atlas, DNA, Passport and planner; actual selected candidate and scope travel with them. |
| Content | Generated concept's fictional spectral labels and inconsistent filtered count intentionally discarded. Only actual dataset/source labels/counts and explicit model limitations appear. Above-fold copy changes are the declared workflow caption, score guide, filtered count and next-step text. |
| Inspector density | Initial long panel left too little list space; moved geology/climate context behind a native disclosure, retained scores and next actions. |
| Scientific imagery | Conceptual generated backdrop intentionally replaced by existing real Esri/MapLibre geography and real cached overlays. The concept is never used as scientific evidence. |
| Mobile | Natural page height replaces clipped fixed-height layout; sticky Map / Results / Selected site controls focus and scroll to real content. No horizontal overflow observed. |

The accepted code-native design has been checked against the concept for layout, copy, palette, typography, icons and spacing, with the intentional scientific deviations above. Final deployed screenshot checks remain U3.

U3 prepublication:85 Python tests + independent numerical reproduction,99 TypeScript tests, strict static build,49/49 production browser workflows and126 responsive cases passed on caf0c93. Final visual inspection at1280×720 found that inspector actions required an inner scroll; a compact-height refinement and a50th browser regression now keep those actions directly visible (new regression passes locally). Rebuild the final committed source, publish, and run all50 public workflows plus36 focused responsive cases before marking U3 complete. The validated JSON report was byte-normalized back to committed source after the validator's newline-only rewrite; no scientific value changed.

Publication checkpoint: final source b6bbbe7 rebuilt successfully; all7 final usability regressions pass against production preview. Version7 native publication succeeded2026-11-15T02:11:15Z and public audience was reverified. Full50 public workflows and36 focused public visual checks are running. DEPLOYMENT.md records exact identifiers/checksums. Leave U3 open until these finish. Do not republish for subsequent acceptance/documentation-only commits.

Next agent: inspect git status/log and STATUS.md before continuing. Update this file at each milestone. Do not treat completed earlier scope as unfinished.
