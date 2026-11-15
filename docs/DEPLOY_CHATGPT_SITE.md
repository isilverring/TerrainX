# Publish TerrainX with Sites

Production URL: https://terrainx-discovery-lab.comfybay1.chatgpt.site. Site ID: `appgprj_6af7ff7626888191bcba757337fd7e9b`. The manifest is `.openai/hosting.json`, with `static.directory` set to `dist`. Publication and rollback records are in [../DEPLOYMENT.md](../DEPLOYMENT.md).

## Prepare

1. Pull the reviewed branch with a clean working tree. Preserve historical science releases.
2. Run scientific validation, `npm run test:unit`, `npm run build` and the production browser suite against `npm run preview` at http://127.0.0.1:4173/.
3. Commit and push the reviewed source. Verify the remote SHA. Rebuild from that exact commit so `build-info.json` identifies the source.

## Package and publish

4. Verify the existing Site's access and retain its public audience. Obtain a short-lived write credential for its source repository. Keep credentials in memory and pass them only through hidden stdin.
5. Use the Sites source workflow to synchronize the exact source commit and package the static `dist/` output with `.openai/hosting.json`. Retain the returned project ID, commit SHA and archive path.
6. Save the pushed SHA and archive as a Site version, then deploy that saved version to the same Site. Follow a pending deployment until it succeeds or fails.
7. Record the returned production URL, exact source SHA, saved version, deployment ID, completion time and archive integrity metadata in `DEPLOYMENT.md`.

## Verify

8. Test the production URL in a fresh signed-out browser. Check the discovery-to-study workflow, polar context, source dialogs, reports, pitch and exports. Run the public browser suite.
9. Prepare an offline demo while online, then reload with the network disabled. Science views and exports should work; third-party tiles and external sources require internet.
10. In a browser with an older prepared build, prepare the update and explicitly activate/reload. Refresh alone intentionally retains the prepared version. Clearing prepared files preserves saved research studies.

Documentation-only commits may follow the deployed source. For rollback, deploy a previously successful saved-version ID from `DEPLOYMENT.md` on the same Site, then check access and science identity.
