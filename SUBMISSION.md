# TerrainX judge briefing

**Planetary Analog Discovery & Mission Readiness Lab** — independent2026 NASA Space Apps project. Challenge reference: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/. The supplied challenge brief guides the implementation; the live challenge URL returned502 during the final source check. No NASA endorsement or field-validation claim.

## What actually exists

130 real NASA POWER grid cells in four bounded regions;16 deterministic automatic candidates;10 preliminary characterized candidates under default assumptions;4 separately labelled reference benchmarks.20 cached POWER point profiles,20 SRTM grids,2 genuine planetary terrain profiles and19 mapped geology contexts. No unverified “winner.”

Separate F terrain fidelity, U mission utility and C evidence coverage, with gated combined priority. Evidence Inspector links claims to units, dates, source hashes, observation support and shared-input limitations. Three Saudi/Chile/Salda cases demonstrate a preliminary hypothesis, a missing mission-specific relevance and a published benchmark. Missing values remain null.

Release3 terrain pilot:2 Earth sites ×2 targets ×10 processing choices =40 real comparisons. Copernicus GLO90 DSM with quality masks, MOLA/LOLA and common8/12km aggregation support. Original SRTM rankings remain intact. Window sensitivity is substantial; numerical convergence is not confidence. All sources, actual results and licence attribution: docs/TERRAIN_PILOT.md.

## Why this matters

- Impact: directs the next field measurement for mission-specific testing rather than declaring analog equivalence.
- Creativity: Discovery Frontier, transparent uncertainty gaps and a processing-sensitivity terrain pilot turn screening into a testable question.
- Validity: reproducible numerical functions, checksum-pinned releases, explicit geological gates and scale/physics limitations.67 Python and61 TypeScript tests;24 production-preview browser workflows.
- Relevance: NASA POWER/SRTM/MOLA/LOLA/GIBS and NASA geological/imagery references support the Earth–Moon/Mars mission use cases. Copernicus is clearly a partner source.
- Presentation: interactive atlas, evidence-backed dossiers, Transfer Lab, Forensics, isolated90-second guided narrative and printable/exportable expedition packet. Offline-prepared science survives tile outages.

## Submission and rehearsal

Use the public URL in DEPLOYMENT.md. Prepare → Offline before the audience demo, then run DEMO.md. Export a Research snapshot to retain the exact release/model and a packet for the chosen site. Include source repository access as permitted by the event; it remains private. The app has no backend, paid API, account requirement or LLM dependency. No new key is needed.

## Honest limits

No field campaign, mineralogical confirmation, access/permit assessment, rover safety certification or NASA approval. Coarse morphology cannot resolve rocks or wheel-soil mechanics. Copernicus water pixels are edited surface elevations; some infill shares SRTM inputs. Aggregation support does not calibrate instrument response. Utility weights, tolerances and scenarios are declared assumptions. Optional polar/SAR/Diviner integrations and a field-study planner are future work.
