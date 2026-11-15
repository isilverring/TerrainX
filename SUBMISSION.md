# TerrainX — project description

Project overview, methods and findings for the Space Apps submission. Presentation format and portal steps: [submission guide](docs/SUBMISSION_GUIDE.md).

## Project title and summary

**TerrainX — Planetary Analog Discovery & Mission Readiness Lab**

Before exploring another world, mission teams need to know where—and what—to test on Earth. TerrainX combines cached NASA observations, planetary topography and mapped geological evidence to screen terrestrial field-testing opportunities. It keeps physical terrain fidelity, mission utility and evidence coverage separate. A reproducible130-cell search reveals mission-dependent leads; a verified lunar south-pole module exposes terrain and thermal differences. Users can inspect sources, challenge scoring assumptions and prepare a proposed field study with stations, measurements and explicit limitations. No score certifies a planetary analog or predicts mission success.

Final project: https://terrainx-discovery-lab.comfybay1.chatgpt.site

Presentation: https://terrainx-discovery-lab.comfybay1.chatgpt.site/#/pitch

## Detailed description

The original discovery screens130 NASA POWER precipitation cells in four bounded study regions, selecting16 geographically separated candidates and characterizing them alongside4 independent reference benchmarks. Ten automatic candidates support preliminary hypotheses under the declared default model; none is field-verified. The expanded experiment characterizes all 130 cells with POWER point climate, SRTM terrain and available Macrostrat mapping. It has79 rankable Mars cells and1 lunar sampling lead under its release model. Its geographically separated Mars shortlist contains13 cells,12 absent from the original aridity shortlist. These are findings within this sample, not first-ever discoveries.

The app reports F, U and C separately and gates a combined priority on evidence. Missing geology stays unknown. The Discovery Frontier asks which next measurement could change an interpretation; six lenses and model-sensitivity analysis show that no single ranking is universally correct. Source inspection retains actual units, periods, response hashes and observation support. The original two-site pilot is retained, and a separate18-site Copernicus/MOLA/LOLA study tests common8/12km aggregation supports across360 valid comparisons, with F-only processing-order sensitivity. Original SRTM rankings remain identifiable.

The lunar reference samples real LOLA profiles at eight IAU feature centres associated with a dated NASA region announcement. Its Diviner thermal/ice-stability model summaries are independently verified against the604.8MB PDS source and published MD5. Area weighting, undefined ice codes and air-versus-surface temperature differences are explicit. Modelled stability is not detected ice, and feature centres are not landing polygons.

The Field Study Builder supports original and expanded cells with genuine cached terrain, proposed stations, local notes, saved models, JSON/GPX and a printable field book. Full study JSON preserves all fields; URL sharing preserves stations/intent/models, while compact QR links are explicitly narrower. Presentation settings preserve the research model. Verified offline preparation supports science and exports while external maps are unavailable.

## Science and delivery evidence

94 Python tests and independent core reproduction; 117 frontend unit tests; 56 production-preview browser workflows. Static React/Vite build, no backend/account/paid API/LLM dependency. All numbers are source-reported, derived, declared scenarios or unavailable. Deployment evidence: DEPLOYMENT.md. Source and licence register: DATA_SOURCES.md. Methods and limits: docs/PACKAGE_AUDIT.md.

## Data, tools and limitations

NASA POWER; NASA SRTM via OpenTopoData; NASA PDS MOLA, LOLA and Diviner; NASA GIBS and original NASA reference imagery; Copernicus GLO90; Macrostrat; GBIF occurrence counts; Natural Earth. Python/NumPy/rasterio/Pydantic/pytest; React/TypeScript/Vite/MapLibre/Recharts/Zod; browser print and Playwright. AI-assisted development is disclosed in the submission guide; complete that field with the team's actual tools.

The eight Research Lab tools connect source-scoped mineralogy, daily climate, resource references, dust scenarios, assay controls, documented caves, measured-grid route analysis and lunar-centre trade-offs to testable field protocols. Lunar illumination uses JPL geometry and bounded LOLA horizons for hourly 2025 samples; route proposals use 18 Copernicus-derived 250 m grids. Analyses and protocols retain their evidence, assumptions and pinned release through export and sharing.

No field validation, confirmed local mineralogy, surveyed local cave inventory, measured local ice abundance, mission-certified illumination engineering, operational safety result or NASA endorsement is claimed. POWER wetness and AOD are model/column descriptors; GBIF density reflects reporting effort, not life scarcity. F remains exploratory morphology, and utility coefficients are experimental assumptions. Broader/global and field validation are future research.

The five-step judge path connects the challenge, searched sample, exploratory lead, independent evidence and next experiment. Published local volcanic samples reveal basaltic-andesite/andesite heterogeneity; a regional Mars source does not verify material inside its candidate window. These scoped positive/negative results improve the hypothesis without claiming field confirmation. Polar references retain their identities through dossiers and field replay, with utility explicitly unassessed.
