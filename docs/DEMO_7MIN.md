# TerrainX — 7-minute scientific demo

Live app: https://terrainx-nasa.vercel.app

This is one continuous story: **a question → a measured candidate → its provenance → the full search → the Moon → a published measurement → a testable field plan.**

Every number below comes from the pinned science release `science-e15ca0c149550211`. Each one appears on screen at the step where you say it.

## Before you start (not timed)
- **Reset the model.** Use default weights, mission **Mars · Jezero**, study **Original study**. Default α is 0.3 for Mars and C_min is 0.7.
- **Preload one tab per step:**
  - home `/#/`
  - `/#/site/saudi-24.000-39.375?mission=jezero`
  - `/#/cells`
  - `/#/lunar-pole`
  - `/#/research-lab?module=mineralogy`
- **If anything is slow,** switch to the next tab and keep talking.
- **Keep the measured / modeled / unknown vocabulary throughout.** It is the scientific spine of the demo.

## Script

| Time | Click / show | Say (science you can point at) |
|---|---|---|
| **0:00–0:30** | **Homepage.** Point at the challenge card and the data credits (NASA POWER, SRTM, MOLA, LOLA, Diviner, SPICE). | "NASA asks which places on Earth can stand in for permanent Moon-base sites and for Mars. TerrainX treats that as a measurement problem. We compare open orbital and reanalysis data, keep three scores separate, and end every answer with a field test that could falsify it." |
| **0:30–1:30** | **Discovery → Original study → Mars → search "Western Saudi Arabia · 02".** Point at F, U, C and P on the card. | "We screened 130 NASA POWER cells across four regions. This shortlisted cell scores:<br>• **F = 94.7**: terrain fidelity, a **Gaussian similarity**, the mean of exp(−½((E − P)/τ)²) over four terrain metrics measured against Jezero's MOLA topography. Relief is 719 m here versus 716 m at Jezero, an almost perfect term. Roughness is 164 m versus 116 m, the weakest term at 0.82.<br>• **U = 66.2**: mission utility, a **weighted mean**. Geology carries weight 0.55 and scores only 0.5, because the mapped unit is sedimentary, not a lake delta or a carbonate.<br>• **C = 100%**: every criterion has evidence.<br>• **P = 74.8 = 0.3 × 94.7 + 0.7 × 66.2**, gated by C ≥ 0.7 and known geology.<br>These are screening scores, not probabilities of mission success." |
| **1:30–2:30** | **Analog DNA → Observations → Evidence Inspector → Forensics.** Rotate the 3D terrain briefly. | "Every value traces to a source response with a **SHA-256 hash**:<br>• SRTM elevations, 90 m native, sampled as a 7 × 7 grid at 4 km over 24 × 24 km<br>• NASA POWER climatology: 0.05 mm of rain per day, 26 °C mean air temperature, 22.4 MJ/m² of sunlight per day<br>• Macrostrat's Neoproterozoic sedimentary and volcaniclastic unit<br>Forensics puts Earth and Jezero side by side at the same footprint. The caveat is spatial scale: this is a regional sample, not a rover hazard survey. Local rocks, obstacles and access must be checked on the ground." |
| **2:30–3:15** | **All cells → Mars.** Click a cell, then point to **"Two shortlists, same rules."** | "Here is every screened cell under the same model. 79 have enough evidence to rank for Jezero. Ranking by mission priority instead of aridity changes the shortlist: **12 of the 13 mission-aware picks are not on the dryness-first list.** So 'dry' is not the same as 'Mars-like'. The released scores are reproduced exactly, so this is the same science, re-sorted by the question." |
| **3:15–4:00** | **Research tools → Lunar pole → Haworth.** Show the LOLA terrain, the Diviner block and the Earth matches. | "Haworth is a 51 km crater at 87.5° south, one of NASA's Artemis III region features.<br>• **LOLA** topography comes from a checksum-verified raster.<br>• **Diviner** reports a median daily maximum of about **61 K**, and nowhere above **93 K**. That puts **100% of the sampled area below the 110 K cold-trap threshold**.<br>• The ice-stability layer returns a code that is not documented, so we report it and don't interpret it.<br>• The best Earth twin, in the Chilean Altiplano, scores F 66. The slopes match, but the relief is 1,754 m versus 1,324 m. At τ = 150 m the Gaussian drives that term to 0.02, so the mismatch is visible, not hidden.<br>Similar terrain does not reproduce lunar cold or prove ice." |
| **4:00–5:00** | **Research tools → Research Lab → Minerals & materials → Lake Salda shoreline → Load published Salda XRD specimen.** | "The Lab answers questions the scores cannot. Lake Salda is a known Jezero analog. This specimen comes from a published **powder XRD with Rietveld refinement** (JGR Planets): **98.6% hydromagnesite and 1.4% aragonite**. These are hydrated magnesium carbonates, the mineral family orbiters detected around Jezero.<br>The **closure screen** checks the phases sum to 100% within the declared tolerance. The record carries its limits: two specimens, not a lake-wide map, and a mineral alone does not prove life.<br>Seven more tools cover sunlight (SPICE), water and ice, dust (the **Shao–Lu threshold**), biology controls, caves, routes on a 250 m lattice, and lunar-base power trade-offs." |
| **5:00–6:30** | **Build this field protocol → Suggest relief transect.** Select a station. Show the hypothesis, measurements, equipment and the elevation profile. Then **Export JSON**. | "The question becomes a falsifiable experiment.<br>• The mineralogy template proposes XRD, Raman or VNIR spectra and thin sections, with a stated success criterion.<br>• The transect runs from the **lowest to the highest cached elevation node** with five stations. The profile and time estimate use **Naismith's rule**.<br>• The export pins the study to the same science release, so anyone can reproduce the plan.<br>These stations are proposals that still need access, permits and safety checks." |
| **6:30–7:00** | Stay on the completed field plan. | "TerrainX turns open NASA observations into a transparent comparison and a testable field plan. Its result is a candidate plus a precise statement of what is measured, what is modeled, and what we must measure next. That is how analog science moves forward." |

## Terms to name, without showing the math
- **Gaussian similarity** for fidelity, with tolerances τ of 3°, 5°, 150 m and 75 m.
- **Weighted mean** for utility.
- **Coverage gate** for priority.
- **SHA-256 provenance**.
- **Diviner 110 K cold-trap threshold**.
- **XRD with Rietveld refinement**.
- **Composition closure**.
- **Shao–Lu threshold**.
- **Naismith's rule**.
- **Froude scaling**: mention only if asked about walking or driving speed on another world.

## Skip during the 7 minutes
- Equation slides.
- Slider adjustments.
- Every Lab tool beyond mineralogy.
- The pitch deck.

## If a professor asks (backup, not timed)
- **Why a Gaussian?** It is smooth and bounded between 0 and 1, and each τ is an explicit, editable tolerance.
- **Why keep C separate?** So that a high score built on missing data can't hide. Unknowns stay unknown and are never treated as zero.
- **Is the ranking robust?** The What-if page re-weights live and reports rank stability.
- **Is 4 km sampling enough?** It is enough for regional screening only. A separate 18-site Copernicus pilot tests 8 and 12 km aggregation on 360 valid comparisons.
- **Is there ice at Haworth?** Diviner shows it is cold enough to trap ice. Abundance is not measured, and we say so.
- **Did you visit the sites?** No. Every station is a proposal, nothing is field-verified, and there is no NASA endorsement.
