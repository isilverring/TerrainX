# TerrainX visual specification

Generated with the built-in Image Gen tool on 2026-11-14. These PNGs are **UI design references**, not scientific observations and not geographic datasets. All maps in the application must use genuine MapLibre-compatible basemap data; never ship the concept map as a scientific image.

## Reference screens

- `explorer-concept.png`: complete primary desktop Explorer. Inspected with `view_image`.
- `landing-concept.png`: complete coordinated landing page. Inspected with `view_image`.

The parent implementer may accept these as the production concept in this action-oriented task; the user did not request a separate design-approval stage.

## Locked tokens

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

Use the supplied exact colors even if image rendering adds subtle texture. Background is dark navy, never pure black. No fake stars, synthetic satellite textures, NASA insignia, or decorative telemetry. Motion: 160–240ms opacity/position transitions only; honor reduced motion.

## Header and global shell

56–64px header. Left **TerrainX** wordmark with bold white title. Essential nav **Discovery** / **Methodology**. Active link teal underline. Landing header has no status badges. Explorer may include subtle `Open science` label. Lucide outline icon family, stroke 1.7–2, 16–20px.

## Landing inventory

Hero, open process band, footer are all visible together on a roomy desktop viewport. Content max width ~1440px; gutters 32–48px. Left column ~48%, globe illustration ~46%. No eyebrow above headline.

Headline, 56–72px desktop, ~1.08 line height, negative tracking:

> EARTH IS OUR FIRST PLANETARY LABORATORY.

Paragraph, 23–28px desktop:

> Discover where to rehearse the science, technology and operations of another world.

Primary teal CTA, dark bold type: **Launch Discovery Engine →**.

Under CTA: `Powered by open NASA science data` and `NASA POWER / SRTM / MOLA / LOLA`. These list supported sources, never imply successful retrieval if a source is unavailable; show actual status in Explorer.

Illustration: code-native stylized cartographic Earth globe with recognizable continents, thin graticule, two restrained orbital arcs and small circles labelled MOON and MARS. It is decorative; accessible description must say illustration. A code-native vector built from real public geographic boundaries is suitable. Do not use generated geographic shapes as scientific layers. Concept has no color overlay on photographs because there are no photographs.

Under thin horizontal rule, four open columns:

1. **01 Discover** — Search real Earth observations
2. **02 Compare** — Separate fidelity, utility and evidence
3. **03 Explain** — Understand where the analogy fails
4. **04 Prepare** — Design a testable field experiment

Footer: event reference and subject categories supplied by user, plus independence disclaimer. Official event/challenge availability is a separate source-verification question; use qualified copy if unverified.

## Explorer inventory

Desktop: top header, then a single primary 3-panel workspace. Approximate proportions: left 22%, map 44%, results 30%, thin 12–16px gutters. At widths below ~1250px keep left ~250px and results ~330px; map flexes. At mobile, map first, collapsible mission controls and bottom results sheet, readable detail routes.

Left **Choose your mission** rail, stacked open sections with dividers:

- Mars/Moon segmented buttons. Mars selected coral border/tint; Moon selected moon-gray border/tint.
- **Target** select: Jezero Crater / Mare Crisium, tied to planet.
- **Mission** heading and source-grounded short objective, not fabricated target measurements.
- **Study region** select: all regions, Western Saudi Arabia, Botswana, Altiplano, Gobi.
- **Source status** rows for POWER, SRTM, MOLA or LOLA, Macrostrat. Populate actual availability, not concept statuses.
- Methodology link.

Center: **Earth discovery atlas** heading strip, genuine dark vector basemap, screen-cell layer, shortlisted markers and separate benchmark symbols. Use circles for candidates, hollow rings for references, translucent small cells for screening. Map controls top-right; legend bottom-left, legal basemap attribution bottom. Do not omit attribution. Selecting a candidate flies to its real coordinates.

Right **Earth experiment suitability** rail is a ranked list, not nested card grid. Selected row has teal 4px left rule and subtle raised fill. Actual identities from pipeline. Each row visibly separates **F fidelity**, **U utility**, **C coverage**; show em dash and reason when unavailable, never made-up zero. Coverage is evidence coverage, not confidence or probability. Benchmark labels must remain distinct.

Selected evidence summary follows open divider. Show geological support and missing evidence, then primary **Analog DNA** and outlined **Analog Passport** buttons. The screen must retain a route to scientific detail and the reality gap.

## Downstream routes / component families

Extend this exact system with typographic sections, small source-linked evidence labels, open tables and horizontal feature tracks. DNA keeps observed, derived, literature-supported, assumed and unavailable status visually distinct. Raw units stay visible. Passport uses compact briefing layout with print CSS (white paper, dark text, no nav), explicit hypothesis, next measurements, sources and limits. Methodology is readable long-form max-width ~960px with equations, source table and results status. No new decorative card systems.

## Interaction / accessibility

Native buttons and labelled selects. Visible teal focus ring. No hover-only scientific content. Preserve 4.5:1 body contrast. Selected nav, selected candidate and status must have text/shape cues as well as color. Lazy-load map and charts. Render accessible table alternatives to charts. Print includes complete candidate data and provenance even when map canvas is omitted.

## Image generation briefs (final prompt record)

Explorer brief: full primary desktop app screen; TerrainX dark NASA/JPL scientific atlas; exact user palette and fonts; slim header; 3-panel mission/configuration, real-geography-inspired flat map concept, ranked suitability list; F/U/C as em dashes; no invented values, winners or NASA endorsement; source statuses conceptual; all actual app UI code native; map must be genuine in implementation.

Landing brief: complete desktop landing with slim TerrainX header, exact headline and CTA, left typography/right code-native cartographic globe illustration, open Discover/Compare/Explain/Prepare band and event/disclaimer footer; exact palette/fonts; no eyebrows, fake metrics, photo texture, extra claims or bento clutter.

## Verification handoff

Before final delivery, parent must inspect both an accepted concept and current browser screenshot with `view_image`, compare directly, fix visual/interaction/responsive issues, and document any concrete design deviations caused by verified data constraints.
