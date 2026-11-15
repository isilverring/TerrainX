# Update the existing public ChatGPT Site

Public audience URL: https://terrainx-discovery-lab.comfybay1.chatgpt.site. Existing Site ID: appgprj_6af7ff7626888191bcba757337fd7e9b. GitHub source stays private. Exact successful publication/rollback IDs are recorded in ../DEPLOYMENT.md.

## Prepare the release

1. In D:\TerrainX inspect git status, pull --ff-only when clean, and read STATUS.md. Keep historical science releases. Use Node 24.x/Python 3.12.
2. Run scientific checks, npm run test:unit and npm run build. Root dist is the publishable output; frontend/src is not a deploy archive. No API key/environment secret is needed.
3. Run npm run preview, then the50 browser workflows against 127.0.0.1:4173. Rehearse offline preparation, a new-cell field proposal, polar selection and export. Commit/push the reviewed source and verify remote HEAD. Rebuild after the final source commit so build-info.json records that exact SHA.

## Publish through Codex with the Sites plugin

4. Ask Codex: “Deploy the verified current main from D:\TerrainX to existing Site appgprj_6af7ff7626888191bcba757337fd7e9b. Preserve public audience and the current URL; do not create a new Site. Record exact source, version, deployment and public checks.”
5. The agent reads .openai/hosting.json and the installed Sites skill, verifies the Site's current audience, and obtains a short-lived source credential. Credentials stay in memory and travel only through the helper's hidden stdin—not shell arguments, files, commits or chat.
6. The Sites source workflow packages the exact pushed source/build with .openai/hosting.json declaring static.directory=dist. It returns project_id, commit_sha and the archive path. Preserve those literal identifiers.
7. Because the Site is public, save_site_version saves the pushed SHA/archive, then deploy_site_version deploys its returned saved-version ID. Poll only pending/building/publishing; stop at succeeded or failed. A failed attempt is not a publication.
8. Record the literal returned production URL, source SHA, saved version, deployment ID and completion time in DEPLOYMENT.md. If publication fails, retain the previous working version and document the actual error before retrying.

## Verify and present

9. Open the returned production URL in a fresh private/incognito window without a login. Confirm the landing page, All cells, Lunar pole, Field study, guided demo, source dialogs and exports. Run the public browser suite; offline preparation is tested against any production catalogue, including the public Site.
10. Research tools → Offline → Prepare offline demo → wait for ready. Reload with network disabled; verify cells, polar science and exports. External tiles/citations remain online-only. The regression also reproduces a host redirect from /index.html to /; checksum verification alone does not prove offline navigation works.
11. If this browser prepared an older build, reconnect and prepare the update; explicitly choose Use prepared update and reload when offered. Refreshing the page alone may intentionally retain the prepared build. Clearing prepared files is a fallback and preserves saved research studies.
12. Commit/push the completion metadata. Later documentation-only commits may follow the deployed app SHA; this distinction is intentional.

Rollback: use the previous successful saved-version ID from DEPLOYMENT.md with the same Site's deployment operation. Do not create another Site or mutate old scientific release folders. Recheck public access and the science ID after rollback. Human submission/video instructions are in SUBMISSION_GUIDE.md.
