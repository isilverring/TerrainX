# Versioned research and offline architecture

## Science releases

`scripts/prepare_release.mjs` creates content-addressed scientific releases. Each manifest records file bytes, hashes, dataset identity and model version. Existing release bytes are immutable. Research packets and snapshots pin that identity; missing or damaged historical assets stop replay without substituting a different release.

## Evidence Inspector

The inspector connects observations to units, actual periods, source responses, calculations, spatial applicability and limitations. Case studies preserve literature geography and distinguish local samples from regional context.

## Presentation state

The guided demo uses isolated session settings. Exiting restores the research model. Atlas selection and comparison state remain separate from presentation choices.

## Offline preparation

The production catalogue lists first-party assets with expected hashes and lengths. Preparation verifies every response before switching the cache pointer. Corrupt updates retain the previous complete version. Cached canonical-index redirects are reconstructed as navigation responses. Lazy science views and exports remain available offline after preparation; third-party tiles and citations need internet.

## Terrain experiments

Comparable-terrain products use real Copernicus DSM/quality masks and PDS rasters, with explicit support, offsets and source metadata. Original SRTM F/U/C/P is preserved. Methods: [TERRAIN_PILOT.md](TERRAIN_PILOT.md).
