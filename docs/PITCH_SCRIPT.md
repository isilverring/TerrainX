# TerrainX pitch — slides and what to say

Story arc: **challenge → gap → our answer → the science → results → why it matters**.

Open the deck at `/#/pitch` on the deployed app. Use the **Pitch slides** item in Research tools, or search "pitch" with Ctrl+K.

- **Navigation:** → / Space / click goes to the next slide, ← goes back, Esc exits. Home and End jump to the first and last slide.
- **Small screens:** scroll within a slide when “Scroll to see more” appears. The header and slide controls remain visible; the hint disappears at the bottom.
- **Numbers:** every number comes from the pinned science release, so the slides always match the app.
- **Submission limit:** Space Apps allows at most 7 slides. The in-app deck has 10. For the submission, see "Choosing 7 for the submission" at the end.

---

## 1 · The challenge
**On screen:** "Where on Earth can we rehearse the Moon and Mars?" Earth sends two animated paths, to a permanent Moon base and to Mars.

**Say (≈10 s):** NASA asked us to find places on Earth that can stand in for permanent Moon-base sites and for Mars. Those are the places where astronauts, rovers and instruments can rehearse before they go.

## 2 · The gap → our answer
**On screen:** "Three gaps. Three answers." Each row runs gap (orange dot) ---→ answer (teal dot), with a tool chip:

| Gap | Answer | Tool |
|---|---|---|
| A handful of famous sites | Search every cell with NASA data | 130-cell search · atlas |
| "Dry" taken as "Mars-like" | Score what the mission needs | F · U · C · Analog DNA |
| Unknowns left unsaid | Label them, then test them | Research Lab · field protocol |

**Say (≈15 s):** We found three gaps in how analog sites get picked. First, people reuse a handful of famous sites, so we search every cell with NASA data. Second, "dry" gets treated as "Mars-like", so we score what the mission actually needs. Third, unknowns go unsaid, so we label them and turn each one into a field test.

## 3 · Our approach
**On screen:** O → O → O → O: **Observe** (open NASA & ESA data) → **Compare** (Fidelity · Utility · Coverage) → **Explain** (what matches, what fails) → **Test** (a field protocol). A light pulse travels along the line.

**Say (≈12 s):** TerrainX is one pipeline. We observe with open NASA and ESA data, compare with three separate scores, explain the match and the mismatch, and end with a test you can run in the field.

## 4 · The science (for the professors)
**On screen:**
- **Fidelity:** F = 100 · meanᵢ exp(−½((Eᵢ − Pᵢ)/τᵢ)²). The terms are median slope, p90 slope, relief and roughness, with τ = 3°, 5°, 150 m and 75 m.
- **Utility · Coverage:** U = 100 · Σ wₖuₖ / Σ_known wₖ and C = Σ_known wₖ / Σ wₖ. Mars weights are geology 0.55, terrain 0.2, aridity 0.15 and temperature 0.1.
- **Priority:** P = (αF + (1 − α)U) · C^γ, with α = 0.3 for Mars and 0.55 for the Moon. P exists only when C ≥ 0.7 and geology is assessed.
- **Footer:** Froude scaling, the Shao–Lu dust threshold, and SHA-256 pinning of every input.

**Say (≈20 s):**
- Fidelity is a Gaussian similarity between Earth and planetary terrain metrics, each with its own tolerance.
- Utility is a weighted score of what the mission needs. Coverage tells you how much of that weight we actually have evidence for, because unknowns stay unknown, never zero.
- Priority blends the two only when coverage reaches 70% and geology is known.
- The physics tools use Froude scaling and the Shao–Lu threshold. Every input is pinned by SHA-256 so results are reproducible.

**If asked:**
- *Why Gaussian?* It is smooth, bounded between 0 and 1, and each τ is an explicit, editable tolerance.
- *Why separate C?* So a high score built on missing data can't hide.
- *Can I change the weights?* Yes. The What-if page re-ranks live and reports how stable the ranking is.

## 5 · What you can do
**On screen:** eight tiles.
1. Discovery atlas
2. Analog DNA
3. What-if & lenses
4. 130-cell search
5. Lunar pole
6. Research Lab
7. Field Study Builder
8. Reproducible

**Say (≈12 s):**
- Explore on a map, globe or in 3D.
- Read why a site matches and why it doesn't.
- Re-weight the model, then search every cell for a mission.
- Study the lunar south pole.
- Use eight research tools, and leave with a field plan, GPX and a printable field book. It all works offline.

## 6 · The search
**On screen:** "130 cells → 13 mission picks" as a 130-dot grid: grey for screened, teal for rankable for Mars (79), gold for mission-aware picks (13). Footer: "12 of 13 picks were not on the dryness-only shortlist."

**Say (≈12 s):** We screened 130 NASA POWER cells. 79 have enough evidence to rank for Jezero Crater. Ranking them for the mission instead of just dryness changes 12 of the 13 picks.

## 7 · Moon base
**On screen:** "Each Artemis-region feature, matched to Earth relief." Rows such as Cabeus B → Northern Chile / Altiplano, F 97; Mons Mouton → F 91; Nobile → F 67; Haworth → F 66.

**Say (≈12 s):** At the lunar south pole we use LOLA terrain, Diviner temperatures and SPICE sunlight at the features named in NASA's Artemis III regions. Each one gets its closest Earth relief twin. Cabeus B matches a site in northern Chile at fidelity 97.

**Careful wording:** say "feature centres", not landing sites. A twin is a terrain match only, not a lunar environment.

## 8 · Honest by design
**On screen:** "Measured. Modeled. Unknown." Three tiles: **4** challenge dimensions covered; **8** open questions with a working tool; **0.38×** Mars gravity: Earth can't fake it, so we say so.

**Say (≈12 s):** Everything is labelled measured, modeled or unknown. Four challenge dimensions are covered outright. The other eight each have a working research tool that tells you what to measure next. Some things, like gravity, Earth simply can't reproduce, and the app says so.

## 9 · Why it matters
**On screen:** "Built so others can push exploration further." Four tiles:
- **Mission teams:** find and justify rehearsal sites.
- **Field scientists:** leave with a ready protocol.
- **Students:** learn what makes Mars, Mars.
- **Open science:** every result reproducible, every gap a question.

Footer: "Open NASA data in, testable science out."

**Say (≈12 s):** This isn't a one-off ranking. Mission teams can justify a test site, field scientists leave with a protocol, and students see what makes Mars, Mars. Everything is open and reproducible, and every gap becomes the next research question. That's how we hope it moves exploration science forward.

## 10 · Try it
**On screen:** "Earth is our first planetary laboratory.", the TerrainX mark and a QR code to the app.

**Say (≈6 s):** Scan the code and try it. Earth is our first planetary laboratory.

---

## 30-second video script (if you submit a video instead of slides)
Record the deck full-screen and advance on each line.

| Time | Slide | Line |
|---|---|---|
| 0–4 s | 1 | "Where on Earth can we rehearse the Moon and Mars?" |
| 4–9 s | 2 | "Analog sites are a famous few, picked for dryness, with gaps unsaid. We fix all three." |
| 9–14 s | 4 | "Three transparent scores: terrain fidelity, mission utility and evidence coverage." |
| 14–19 s | 6 | "130 cells searched. Mission-aware ranking changes 12 of 13 picks." |
| 19–23 s | 7 | "Each Artemis-region feature gets its closest Earth terrain twin." |
| 23–27 s | 9 | "Open and reproducible, so every gap becomes the next experiment." |
| 27–30 s | 10 | "TerrainX. Earth is our first planetary laboratory." |

## Choosing 7 for the submission
Use slides **1, 2, 4, 6, 7, 9, 10**: challenge, gap → answer, science, results, Moon base, why it matters, try it. Say the four-step approach (slide 3) and the measured/modeled/unknown honesty (slide 8) out loud. For a product-minded audience, swap slide 7 for slide 5 (features).

## Claims to avoid
- No "first discovery", "NASA-approved", "verified field site" or "landing site".
- Say "we address" or "we answer" the gaps, not "we solved Mars analogs". The answers are tools and evidence, not field confirmation.
- Twins are terrain matches. Ice, sunlight and minerals at candidates remain modeled or unknown.
- Say "independent project using open NASA data".
