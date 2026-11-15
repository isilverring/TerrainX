# TerrainX project status

Source: `main` at [isilverring/TerrainX](https://github.com/isilverring/TerrainX). Application: https://terrainx-nasa.vercel.app (Vercel production; the earlier ChatGPT-hosted Site at https://terrainx-discovery-lab.comfybay1.chatgpt.site is the previous host).

## Current source

Score typography and supporting labels have been enlarged across the app. The discovery-story cards spell out F/U/C/P; phone forms and touch controls are easier to use. Comparison spacing is corrected on phones. The pitch (now seven slides, the Space Apps limit) has responsive content scrolling, complete equations, larger labels, visible navigation and reduced-motion support. Local validation: 117 unit tests, strict build, 56 browser workflows, 96 broad responsive cases, 32 focused readability cases and 40 pitch cases. Scientific inputs and model outputs are unchanged.

The application includes the Discovery atlas, expanded search, polar references, eight Research Lab tools, persistent field protocols, guided demo and pitch deck. Mission/filter navigation preserves the selected mission; shared field studies preserve their release, collection, target, protocol and model. Unsupported protocol/mission combinations stop with an explicit explanation.

Science release: `science-e15ca0c149550211`. Original dataset SHA-256: `3515ef6928e79570c32a6777561cfa33340ac29c377b7468ac6a6baf676e3a4c`. Original observations and historical release folders are preserved.

## Validation and publication

Scientific validation: 94 Python tests plus independent numerical reproduction. Frontend validation: 117 unit tests and strict TypeScript/production build. All 56 local and 56 fresh public browser workflows pass, with 96 local responsive cases, three public visual cases and successful report/protocol checks for all eight Lab tools. Detailed acceptance is recorded in [docs/QA.md](docs/QA.md). Exact live source, saved version and deployment status are recorded in [DEPLOYMENT.md](DEPLOYMENT.md); repository HEAD may include later documentation updates.

Public version 10 is deployed from `d13cd4e16899a471109d4585f4e25b1fb7d9664b`; the public build metadata matches. The readability and pitch review is complete and publicly verified, including 40 public pitch cases and three public score/mission/form interaction cases.

## Local preservation

`D:\TerrainXBackup1` is the frozen complete project copy at `fbbc1a77c2065e1e27be83da8784deb894eb6cf3`, taken before submission editing. It includes Git history, dependencies, source caches and build artifacts. Work continues in `D:\TerrainX`. The backup contains 29,024 files totaling 2,995,133,041 bytes. Its hashes were inventoried and its Git objects verified. The inventory is stored separately at `D:\TerrainXBackup1.manifest.json` (SHA-256 `44d18cdf9ac7b21a3420df56e59662f6adc4fa2f820ebfedb531013d786f0df5`).

## Scientific scope

The original 130-cell/16-candidate/four-benchmark study and the expanded 134-profile collection remain distinct. Polar utility is unassessed; combined priority remains unavailable. Mineralogy, cave geometry, microbial assays, resource abundance, landing suitability and route safety require appropriate field or engineering evidence. Software workflows do not establish those properties.

Development and validation commands: [NEXT_STEPS.md](NEXT_STEPS.md). Presentation and submission: [DEMO.md](DEMO.md), [docs/PITCH_SCRIPT.md](docs/PITCH_SCRIPT.md), [docs/SUBMISSION_GUIDE.md](docs/SUBMISSION_GUIDE.md).
