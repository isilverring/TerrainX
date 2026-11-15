# Use of artificial intelligence (AI) in TerrainX

NASA Space Apps permits AI tools and requires teams to say where and how they were used. For code and data, AI generation must be acknowledged in descriptive text and in metadata. Images and videos need a visible AI watermark. This file is the project's full statement. The same acknowledgement is also in:

- README.md
- SUBMISSION.md
- DATA_SOURCES.md
- the app (Methodology page and landing footer)
- the metadata files listed at the end

## Tools

- **OpenAI Codex** and **Anthropic Claude** were used as AI coding assistants under the team's direction and review.
- OpenAI's ChatGPT-hosted Sites served an earlier public deployment. The current host is Vercel, which uses no AI.

## Where AI was used

| Area | How AI was used |
|---|---|
| **Code** | AI assistants generated and edited large parts of the application: the React/TypeScript frontend, Python science pipeline, data-acquisition and import scripts, build scripts, and the unit and browser tests. The team directed, reviewed and accepted the changes. |
| **Data** | AI-written scripts download, verify and process the source data, and compute the derived products in each science release: terrain metrics, F/U/C/P scores, cell search, lunar-pole summaries and evidence records. AI also helped curate the literature-based evidence records, such as the Lake Salda XRD values, from cited publications. |
| **Documentation** | AI drafted and edited the README, methods, status, demo and submission documents. |
| **Presentation** | AI generated the in-app pitch slides (`/#/pitch`), the PowerPoint decks built from them, the demo scripts and the social-preview image (`og-image.png`). The preview image carries a visible "AI-assisted image" watermark. |

## Where AI was *not* used

- **No AI-made observations.** Observations come unchanged from the cited NASA, partner and literature sources: NASA POWER, SRTM, MOLA, LOLA, Diviner, GIBS, Copernicus GLO-90, Macrostrat, GBIF and the cited papers. Each retrieved response is stored with its SHA-256 hash.
- **No AI estimates.** No AI model creates, estimates, fills in or alters a scientific value. Every derived value comes from deterministic, tested code with stated equations, and missing evidence stays empty.
- **No AI at runtime.** The application calls no AI or LLM service. It runs as a static site and offline.

## Machine-readable acknowledgement (metadata)

- `package.json` and `frontend/package.json`: an `aiDisclosure` field.
- `frontend/index.html`: `<meta name="ai-disclosure">`.
- `build-info.json`, served with every deployed build: an `ai_disclosure` field.
- `science/__init__.py`: a module docstring statement for the Python pipeline.

Science releases are immutable, so their manifests are not rewritten. This statement and `build-info.json` cover them.
