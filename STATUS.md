# TerrainX recovery checkpoint — partials P1–P3 complete, showcase polish done

**New scope active: implement the eight partial challenge dimensions.** See docs/PARTIALS_IMPLEMENTATION.md P1–P4. Previous U1–U3/M1–M6 are complete. Main was clean/up to date at 1b3be13; public version 8 stays live during this work. Current step: source-verified preprocessing and numerical models, followed by eight usable Research Lab workflows. Keep source-scoped evidence/unknowns distinct from measurements. Check git log for the last pushed milestone.

P1 complete: real SPICE/LOLA illumination preprocessing and 18 Copernicus 97×97 route-analysis grids generated;7 new tests pass. Sources/checksums/Horizons responses retained; spiceypy8.4.0 pinned; binary kernels ignored. Next P2: eight interactive Research Lab modules and source registry normalization, then integration/tests/publication. No new science release has been prepared yet.

P2 complete locally: all 8 Research Lab analysis tools render,9 reference records normalized,18 real 2025 POWER daily profiles cached.94 Python tests/independent reproduction,14 added frontend numerical/schema tests and strict TypeScript pass. Next P3: challenge/navigation/Passport links and dedicated field-protocol persistence; then P4 full production/public acceptance. Read docs/PARTIALS_IMPLEMENTATION.md for precise remaining work; public version 8 still live.

Presentation pass (laptop, 2026-11-15):
- New `/#/pitch` deck with 10 minimal-text slides (challenge → gap → answer → science → results → why it matters) and creative visuals: dot flows, a 130-dot funnel, twin connectors and equations. Every number is read from the pinned release. Speaker text is in docs/PITCH_SCRIPT.md, which also says which 7 slides to submit.
- Landing order is now hero → challenge answer → findings → compact Beyond block → Research Lab → workflow.
- Hero buttons sit on one row.
- Long caveats on the Field Study, Terrain pilot and Research Lab pages now show one line plus a "Limits" toggle. The full text prints automatically.
- Discovery atlas: a narrower mission rail, a "Why this target matters" toggle and a mission-tinted selected site.
- Guided demo: directional scene transitions and a progress line.

Showcase pass (laptop, 2026-11-15, after P3):
- Landing gains "Where on Earth can we rehearse a Moon base and a Mars mission?" (world cards for the Moon base, the Mars/Moon missions and fieldwork) and an eight-tile Research Lab grid with a measured/modeled/unknown legend.
- The guided demo gains scene 10, "The open questions" (eleven scenes in total).
- Fixed a global bug: Tailwind's `.outline` utility drew a 3 px outline on every `.button.outline`.
- Fixed about 60 glued word/number strings in the Research Lab, polar and pilot copy, plus the judge path's "1 /5".
- Research menu: top-aligned groups, outside-click close and a chevron.
- Lunar-base table: sunlight and index bars, and rule chips.
- Mobile lab tables scroll inside their container.
- A 31-route × 2-width sweep found no page overflow and no app errors.
- Final local checks: 94 Python tests, 116 Vitest tests, strict build and 51 of 53 Playwright tests pass against the preview. The other two need live basemap and terrain tiles, which this workspace cannot reach. One of them passes with TERRAINX_OFFLINE=1 and the other skips. Rerun both on the PC with network.

P3 complete (laptop session, 2026-11-15): Research Lab protocol templates now open in the Field Study Builder from `?lab=<module>`. They are stored as `lab_module`, carried in full and compact share links (key `l`), and printed in the field book. Challenge fit uses "Bounded workflow" status semantics: each former partial card lists measured, modeled and still-unknown evidence, links to its Research Lab tool, and counts source-scoped reference records from challenge_evidence.json. Older releases get an explicit fallback note. Research Lab and Challenge fit are in the research menu and the command palette, which also lists the eight modules and a per-candidate entry. Analog DNA, /cells and the Passport link to the lab. The Passport has a printable "What this dossier cannot answer yet" checklist with Lab and Protocol links. Checks: 94 Python tests, 116 Vitest tests and strict build pass. Playwright against the local preview: 48 of the 50 existing tests pass, plus 3 new ones, and the updated challenge-fit test passes. The other two need live basemap and terrain tiles, which this cloud workspace cannot reach. One of them passes with TERRAINX_OFFLINE=1; the live Worlds/terrain-tile test skips in offline mode and should be rerun on the PC. Next: P4 docs/QA plus showcase UI polish. Deployment is done by the user.

**All requested usability milestones U1–U3 are implemented, pushed and publicly verified.** Canonical checklist and audit: [docs/UX_REFINEMENT.md](docs/UX_REFINEMENT.md). Earlier science improvements and Packages A/B/C remain complete within their documented boundaries; see docs/CHALLENGE_COMPLETION.md and docs/PACKAGE_AUDIT.md. No required implementation, validation or deployment step remains in this scope.

Work: D:\TerrainX, private https://github.com/isilverring/TerrainX, main. Public app: https://terrainx-discovery-lab.comfybay1.chatgpt.site . Site version 8, exact runtime source **778b3cfc995083666425b236accf444bbf1c3cdf**. Native publication succeeded 2026-11-15T02:21:33Z; audience public reverified. DEPLOYMENT.md contains literal version/deployment/archive IDs, checksums and tested rollback versions. Subsequent test/documentation commits intentionally differ from deployed runtime source.

## Completed in this follow-up

- Discovery filters, selected site and comparison context survive dossiers, reload and browser history. Invalid/filtered selections are explicit; duplicate or unavailable comparison picks do not create extra sites.
- Wider real map; Discover → Inspect evidence → Prepare experiment navigation; score explanations; filter reset/count; selected-site planning; collapsible supporting context; sticky dossier sections.
- Natural mobile page height and Map / Results / Selected site navigation; short-laptop actions remain visible. Comparison target controls wrap correctly. Polar comparison and printable Passport show S/W hemispheres correctly.
- Field planning respects Original study 20 records versus Expanded search 134 profiles. Shared plans restore and pin their declared collection, mission, polar reference and protocol. Field-study evidence links carry the saved model.
- Supplied logo and independent Mars artwork preserved. No scientific input, score or source attribution was fabricated or upgraded. No dependency or API key added.

## Final validation

**85 Python tests plus independent numerical reproduction;99 TypeScript tests; strict production build;50/50 fresh public Chrome/Playwright workflows;36 focused public responsive cases.** An initial public run had 49 passes and one outdated text assertion; it was corrected and the complete suite passed in 2.8 minutes.90 broader local route/width cases also passed. No observed overflow, broken local images, framework overlays or application exceptions. Concept and latest public renders inspected at 1568×1003 and phone/short-laptop sizes. Browser plugin unavailable; existing Chrome/Playwright fallback used. Firefox/Safari, formal accessibility certification and hosted CI status are not asserted.

Science release **science-79daa128eae12594**, original dataset SHA2563515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c unchanged. Original 130 cells/16 automatic candidates/10 preliminary characterized/4 benchmarks. Expanded search 130 profiles;18-site support study 360 comparisons. Real MOLA/LOLA and polar reference limits remain documented. No field verification, observed ice, rover safety certification or NASA endorsement is claimed.

## Resume and present

Read NEXT_STEPS.md before new work. Existing prepared browsers: Research tools → Offline → prepare update → explicitly activate/reload. Saved studies remain. Local QA servers 5173/4173 have been stopped; npm run dev or npm run preview restarts them. Credentials were kept in memory and cleared.

Use LIVE_DEMO.md/DEMO.md for rehearsal and docs/SUBMISSION_GUIDE.md for human video/team/terms/submission actions. Field mineralogy, resource validation and further global/polar research require separately scoped evidence; they are not hidden pending software steps. Do not resume completed U1–U3 or M1–M6 as unfinished. Checkpoint every future completed milestone, push and verify remote SHA.
