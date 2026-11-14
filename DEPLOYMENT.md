# TerrainX current public release

- Public URL: https://terrainx-discovery-lab.comfybay1.chatgpt.site
- Audience: public (verified before publication); source GitHub repository stays private.
- Site: `appgprj_6af7ff7626888191bcba757337fd7e9b`
- Saved version 4: `appgprj_6af7ff7626888191bcba757337fd7e9b~appgver_bfaef974853c8191ab6ac8f34578668e`
- Deployment: `appgdep_6af8849f65ec81919ca7a01a106abfbf`
- Native publication: **succeeded**, 2026-11-14T15:56:31.497315+00:00.
- Exact deployed source: `b6d8000710b0390f4e209579945fb3900f8e88e4`.
- Science release: `science-b1a132b201ad2046`.
- Dataset SHA256: `3515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c`.
- Archive: `D:\TerrainX\outputs\terrainx-reviewed-release5.tar.gz`, content hash `0955f5942fb85bb9aacd304a4cf0cd657955337c1d3773f85434271444a7976b`, 210 files.
- Pre-publication evidence: 81 Python tests + independent reproduction; 89 TypeScript tests; 38 production-preview workflows; 85 responsive route/width checks. Production dependency audit: 0 known vulnerabilities.
- **Fresh unauthenticated public Chrome/Playwright sessions: all 38 workflows passed (2.8 minutes), including offline reload, corrupted-update recovery, exact historical/model replay, new-cell field planning, polar science, exports and guided presentation.** Public desktop/mobile screenshots verify the exact deployed SHA and render without overflow, framework overlays, missing local images or application exceptions. Local visual sweep: 17 routes × 5 widths = 85 cases (390–1568 px). Browser plugin unavailable; installed Chrome was used. Firefox/Safari and formal accessibility certification were not tested.

Rehearsal/deploy steps: [LIVE_DEMO.md](LIVE_DEMO.md), [ChatGPT Site guide](docs/DEPLOY_CHATGPT_SITE.md), [Vercel alternative](docs/DEPLOY_VERCEL.md). Submission/human steps: [docs/SUBMISSION_GUIDE.md](docs/SUBMISSION_GUIDE.md). No API key required.

Rollback to previous known-good version 2 below using the same Site's saved-version deployment operation. Keep historical science releases unchanged. Browsers with an older prepared offline build must reconnect, prepare the update and explicitly activate/reload. Later documentation-only commits intentionally differ from the deployed app SHA.

Version 3 (`appgprj_6af7ff7626888191bcba757337fd7e9b~appgver_9ef1bb0aeb148191822f79b85c6613bd`, source `c67142255e9b0495b71fbd7a44f1ffd1d95452f3`, deployment `appgdep_6af881faf49c8191b868a572677ea385`) published successfully but passed only 37/38 hosted workflows: canonical-index redirects broke offline reload. Version 4 repairs that defect. Avoid version 3 for an offline presentation.

## Previous successful release (rollback)

# TerrainX public audience release

- Public URL: https://terrainx-discovery-lab.comfybay1.chatgpt.site
- Audience: **public**, explicitly requested by the owner; no visitor sign-in required. Source GitHub repository remains private.
- Site project: `appgprj_6af7ff7626888191bcba757337fd7e9b`
- Saved version: `appgprj_6af7ff7626888191bcba757337fd7e9b~appgver_b07041429d008191bb9fd5486f53163c`
- Deployment: `appgdep_6af8357c44d88191bc183f181b648959`
- Deployment result: **succeeded**, verified 2026-11-14T10:18:54.289972+00:00.
- Audience update: public access revision 2, verified 2026-11-14T10:19:15.691202+00:00.
- Exact deployed source commit: `ca32f17f46c05276541d8b62c246dbfc89f66b4c`.
- Build artifact: `D:\TerrainX\outputs\terrainx-reviewed-release.tar.gz` (ignored).
- Fresh unauthenticated Playwright/Chrome sessions passed **all 16 production workflows on the public URL**.
- Additional live 3D/globe round-trip: zero page/console errors; 89 successful terrain tile responses.
- Science: 63 Python tests, independent result reproduction, 52 TypeScript science tests; strict TypeScript/build pass; npm audit 0 known vulnerabilities.

The linked Site identity is retained in .openai/hosting.json. Do not create a duplicate. It was published using the previously owner-private operation, then its audience was changed to public as the owner requested. Native access and live browser checks both confirm the public result.

Later documentation-only commits record completion; app/data correspond to the source commit above. Use git log for the latest recovery checkpoint. Read LIVE_DEMO.md for presentation, local fallback and step-by-step Netlify/Vercel instructions. No API keys or runtime secrets are needed.
