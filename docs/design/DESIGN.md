# TerrainX visual system

TerrainX uses a dark scientific workspace with readable type, fine borders and mission-specific color cues. Design references in this folder illustrate the visual system; scientific maps and imagery use real source data.

## Tokens

| Token | Value |
|---|---|
| Background | `#080D18` |
| Panel | `#111A29` |
| Border | `#29384E` |
| Earth / active / primary | `#35C3B0` |
| Mars | `#F17E5A` |
| Moon | `#C6D7E8` |
| Text | `#F2F5FA` |
| Secondary | `#97A8BD` |
| Titles | Space Grotesk, 600–700 |
| Body / controls | Inter, 400–600 |
| Numbers / units | JetBrains Mono, 400–500 |
| Corner radius | 6px controls, 8px major panels |
| Border | 1px; use open rows and fine dividers |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64px |

## Layout

The landing page introduces the challenge, evidence, findings, Research Lab and field workflow. Its globe uses real geography and candidate points; the Moon and Mars graphics are decorative illustrations.

The desktop Discovery workspace has a mission rail, a large Earth atlas, ranked results and selected-site actions. Smaller screens use a single page with Map / Results / Selected site navigation. Controls remain available on short laptop screens. Supporting explanations use disclosures; complete limitations expand when printing.

Evidence pages use source-linked values, visible units, open tables and explicit observation/model/scenario/unknown labels. Passport and field-book print layouts use white paper with dark text. Tables and source URLs wrap or scroll within their own containers.

## Maps and branding

MapLibre displays genuine geographic layers and visible attribution. POWER/SRTM footprints show the source support, independent of the apparent sharpness of imagery. Terrain exaggeration is labeled. Missing data use an unavailable state.

The orbital X brand mark preserves its separated geometry and two tapered arcs. The production SVG uses silver and cyan on transparency. Branding and presentation art are separate from scientific evidence.

## Interaction and accessibility

Controls use native buttons, labeled inputs and visible focus. Selection and evidence states use text/shape as well as color. Keyboard navigation supports the command palette, atlas and presentation controls. Reduced motion is respected. Chart tables and complete print content support alternative reading paths. Formal accessibility certification has not been performed.

Current browser and responsive checks are recorded in [../QA.md](../QA.md).
