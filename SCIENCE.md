# TerrainX scientific method and actual findings

Independent research prototype: no planetary equivalence, field verification, rover/landing safety certification or NASA approval is claimed.

## Actual release

130 valid NASA POWER grid cells;16 algorithmically shortlisted candidates;4 separately labelled benchmarks;20 POWER point profiles;20 real SRTM49-point terrain grids;2 real planetary DEM profiles;19 Macrostrat mapped-geology responses; no acquisition errors. Ten automatic candidates meet the declared default evidence gate for a preliminary mission-specific hypothesis. None is field-validated. No automatic candidate has established direct lunar-basalt relevance in the selected map evidence. This honest negative/unknown lunar result must not be replaced with assumed basalt.

“Discovered” means previously unshortlisted by this reproducible bounded search, not unknown to geological literature. Benchmark references are never counted as new discoveries.

## Two-stage geographic screening

| Region | Bounds [west, south, east, north] | Actual cells |
|---|---|---:|
| Western Saudi Arabia |[38,24,41,26]|25|
| Botswana dry basins |[24.5,-22,27.5,-19]|35|
| Northern Chile / Altiplano |[-70,-25,-67,-22]|35|
| Gobi |[101,42,104,45]|35|

Stage A retrieves one PRECTOTCORR parameter per regional request and preserves every cell. Actual meteorological centers follow 0.5° latitude×0.625° longitude, rather than assuming the documentation example's nominal 0.5° square grid. The mean daily rate must have mm/day units before conversion:

`Pannual=365.25×Pdaily`; `Sarid=clamp(1−Pannual/400,0,1)`.

400mm/year is an application assumption, not planetary precipitation equivalence. A public-domain Natural Earth 110m broad land mask excludes coast/water-screened centers from selection while retaining them in the GeoJSON. It is approximate near coasts, not a field-scale coastline or access survey. Selection is descending aridity, latitude/longitude tie-breaks, up to 4 per region, minimum 65 km separation.

Stage B retrieves point climate, SRTM terrain and mapped geology for the 16 candidates plus 4 benchmark subsites. A dry basin does not establish lake sediments, carbonate, mineral preservation, caves or habitability. Generic volcanic material is not automatically basalt.

## Earth observations and units

Actual POWER climatology period: 2001–2025. Regional responses expose start/end; point responses expose the actual period through `header.range`. Both formats are parsed; unknown periods remain unavailable. PRECTOTCORR:mm/day; T2M:°C; WS10M:m/s; PS:kPa; RH2M:%; solar irradiance:**MJ/m²/day** for the queried AG community. Original returned units remain visible.

POWER combines gridded reanalysis and satellite-derived products. The UI's MEASURED label denotes the provider-reported observation product, not an instrument at an outcrop. Meteorological support is 0.5°×0.625°; solar support is 1°×1°. Seasonal range=max(monthly mean T2M)−min(monthly mean T2M); it is not a daily swing or planetary surface temperature.

SRTM90 m via OpenTopoData is bilinearly sampled on 7×7 points at 4 km spacing,24×24 km center-to-center footprint. The≈90 m source resolution is not the analysis spacing. Earth coordinate offsets use a 6371000 m spherical approximation with latitude-dependent longitude spacing; this is regional analysis, not a surveyed grid. Requests contain≤100 locations and are separated by≥1.05s; successful responses are cached. This run used 20 SRTM requests, below the published 1000/day limit. No fine boulder, cave or landing-hazard inference is made.

## Planetary DEMs: real and metadata-validated

Jezero 18.45°N,77.45°E uses MOLA MEGDR16. Mare Crisium 16.18°N,59.10°E uses LOLA LDEM16. Real global rasters are 5760×2880 signed 16-bit samples. Detached PDS metadata validate file dimensions, size, endian order, scale, units, projection, coordinates, pixel centers and source extrema before extraction.

- MOLA:big-endian; height in meters above the areoid; scale 1.
- LOLA:little-endian;`height_m=DN×0.5` above the 1737400 m reference sphere. Do not add the radius to a height.
- PDS4 upper-left bounds validate pixel centers:lon=(col+0.5)/16; lat=90−(row+0.5)/16. PDS3 offset conventions differ between these products; one guessed formula is not applied to both.
- Longitude is 0–360° east-positive. Local spherical offsets use the map sphere radius in each validated label. Exact native DNs used for interpolation are committed.
- Native N–S support is≈3704.46 m(MOLA),1895.21 m(LOLA); E–W support varies with latitude. Identical pixels/degree does not mean identical physical resolution.

Both targets have 49 real samples on a 4 km lattice across 24 km, with bilinear interpolation and no additional smoothing. Broad MOLA cannot resolve detailed delta structure; neither profile resolves rover-scale rocks or mechanics.

## Terrain features and compatibility

`dz/dx=(zE−zW)/(2dx)`;`dz/dy=(zN−zS)/(2dy)`;`θ=atan(hypot(dz/dx, dz/dy))×180/π`.

Central differences use interior cells and physical meters.4 km sample spacing means 8 km derivative baseline. Missing neighbors exclude derivatives. Require≥90% valid elevations and adequate interior slopes.

`H=Q95(z)−Q05(z)` in meters;`HL=H/L` dimensionless. Least-squares plane:`ẑ=ax+by+c`; detrended RMS:`R=√mean((z−ẑ)²)` in meters. R is coarse terrain variation, not centimeter-scale regolith roughness. Absolute elevations across unlike reference surfaces never enter similarity.

The scale gate requires real available profiles, provenance, required metrics, spacing/footprint within 5%, and native pixels≤1.05×sample spacing. Failure gives F=null.

**Unequal native support remains:** common 4 km spacing does not harmonize≈90 m Earth point samples with kilometer-scale planetary pixels. No matched area averaging is applied. Bilinear/source-team interpolation can bias scores. The app explicitly labels fidelity exploratory broad morphology and warns that it is not scale equivalence or mission-safety validation. A future study should test matched physical filtering, multiple baselines and tolerance sensitivity.

## Distinct F, U, C and optional P

`si=exp(−0.5((Ei−Pi)/τi)²)`;`F=100×weighted_mean(si)`. Equal weights across median slope, p90 slope, relief, detrended RMS. Illustrative tolerances: 3°, 5°, 150 m, 75 m. They are not calibrated NASA limits, instrument uncertainty or established equivalence standards. Contributions remain in the dataset.

`U=100×Σavailable(wk uk)/Σavailable(wk)`;`C=Σavailable(wk)`.

Unknown is null, never zero. Partial U can be high when geology is missing; its lower denominator and insufficient coverage are disclosed. C is assessed weight, not confidence, quality or probability. Rankings are Earth experiment suitability, not universal planetary similarity.

| Criterion | Jezero | Mare Crisium |
|---|---:|---:|
| Geological/process or basaltic relevance |.55|.55|
| Terrain fieldwork |.20|.30|
| Earth dry conditions |.15|.10|
| Earth thermal logistics |.10|.05|

All weights sum to 1 and are adjustable in the UI with normalized controls/reset. Observations remain unchanged; U, C, status and eligible P update. Printed passports include active weights. Dataset downloads retain the original default release.

Geology: 1 documented matching material/process;.5 partial evidence;0 documented mismatch; null unknown. Assessed scores carry sources and rationale. Broad sedimentary/possible carbonate context earns at most partial Jezero relevance without verified lake/preservation evidence. Original map scale classes, citations and source/map IDs remain available. A mapped lithology is not confirmed field mineralogy.

Published benchmark subsite evidence takes precedence over regional polygons: Salda's documented hydromagnesite shore must not gain lunar-basalt relevance from a coarse ophiolite polygon. Salda is a known reference, not a new discovery.

Terrain utility uses a bell preference for p90 slope centered 3°(Mars) or 5°(Moon), width 5°. Thermal logistics uses `clamp(1−|Tannual−10°C|/40°C,0,1)`. These are explicit field-experiment assumptions, not planetary surface-temperature or rover-safety models. Characterized status requires C≥.70 and supported geology≥.5; it remains preliminary.

`P=(αF+(1−α)U)×C^γ`, with α=.30 Mars,.55 Moon,γ=1. Require F, U available, C≥.70 and assessed geology. No probability or mission approval is implied.

## Reality gap and experiment design

Every dossier separates MATCH, MISSION USE, MISMATCH, MISSING. Earth does not reproduce reduced gravity, Martian low-pressure CO₂ atmosphere, lunar vacuum, radiation, regolith mechanics, weathering, biology or water effects. `Fparallel=mg sinθ`, `N=mg cosθ` are simple force components, not wheel traction, sinkage, slip or cohesion models.

Deterministic experiment cards propose hypotheses, equipment, measurements, an explicitly proposed metadata-completeness indicator, next measurements and limits. No experiment has been performed and no outcome is invented. Local mineralogy, grain size, bearing strength, terrain, access, hazards and permits require field verification.

## Prompt 2 analyses (all deterministic, all tested)

### Discovery Frontier — decision sensitivity to missing evidence
For a missing normalized criterion s∈[0,1] the declared utility model is evaluated at s=0 and s=1 with known inputs kept, using the full weight denominator: `U_min=100·Σ_known wₖuₖ/Σwₖ`, `U_max=100·(Σ_known wₖuₖ+Σ_missing wₖ)/Σwₖ`. With several missing criteria this is the worst/best case. The partial U always lies inside the interval. After measurement C=1, so `P∈[αF+(1−α)U_min, αF+(1−α)U_max]`. The interval is a hypothetical mathematical bound — not an observation, not a prediction, and the optimistic end is not expected. "Measurement Priority" (not expected value of information: no probability or cost model exists) is High when the gap is mission-essential (geology gates characterization) and the U interval crosses the best fully assessed benchmark or spans ≥3 ranks among fully assessed algorithmic candidates; Medium when one condition holds; Low otherwise. Real release: 6 Mars and 16 Moon research candidates, all missing geology. Recommended measurements are declared templates (XRF, Raman, petrology, stratigraphic logging, grain size, photogrammetry, LiDAR, dGNSS, penetrometer, shear, wheel-slip, dust).

### Planetary Transfer Lab
`Fr=v²/(gL)`; equal Fr at equal L gives `v_target=v_earth·√(g_target/g_earth)`; `F∥=mg sinθ`, `N=mg cosθ` with a hypothetical mass. g = 9.80665 m/s² (standard gravity), 3.71 (Mars), 1.62 (Moon). Earth density `ρ=p/(R·T)` uses NASA POWER PS converted from its stated unit (kPa→Pa) and T2M from °C to K, dry-air R=287.05 J/(kg·K) (humidity ignored; annual means). `q=½ρv²`. Mars is a visibly labelled scenario (p=600 Pa, T=210 K, R=188.9 J/(kg·K)), not a Jezero measurement; the Moon's aerodynamic q≈0. Froude matching is one dimensionless dynamic-similarity condition; it does not predict traction, sinkage, slip, wheel failure, safety or operational speed limits. Equal dynamic pressure is not equal dust entrainment (cohesion, particle properties, friction, turbulence, electrostatics). Missing PS or T2M is reported, never filled.

### Analog Forensics
A TypeScript port of `terrain.py` (numpy-linear quantiles, interior central differences, least-squares plane) reproduces all 22 cached Earth and planetary metric sets. Heightmaps (relative elevation × Lambert hillshade, light 315°/45°), slope maps and W–E / S–N profiles are drawn cell by cell from real arrays; a missing or incomplete grid draws nothing. Vertical exaggeration 1×/3×/5× is always stated; profiles use true horizontal scale and report the exaggeration actually shown.

### Counterfactual explorer, Pareto frontier, ranking stability
F, U, C and P are recomputed from stored feature and criterion values with the pipeline equations (defaults reproduce the stored values exactly). Only algorithmic candidates with F and U, assessed geology and C≥C_min are ranked; unknown geology is never ranked as a geological analog. Explanations use an exact sequential decomposition `ΔP=ΔP_α+ΔP_τ+ΔP_w` and name the largest term. Pareto: A dominates B when F_A≥F_B and U_A≥U_B with one strict inequality; low-coverage points are shown hollow and excluded. Ranking stability: 200 scenarios from a seeded mulberry32 generator perturb each weight and tolerance uniformly by ±range (default 25%) and renormalize weights; outputs are median/best/worst rank, IQR and the shares ranked first or in the top three. This is weight/tolerance sensitivity only — not statistical confidence, evidence completeness, measurement uncertainty, model-structure uncertainty or a probability of success.

### Beyond the known analogs
Best documented benchmark, best characterized exploratory candidate and the driest shortlisted screening cell are shown with distinct statuses. "Unexpected within this screened sample" lists exploratory candidates whose P meets or exceeds the lowest benchmark P (Mars: Western Saudi Arabia · 02, P 74.8 vs Yungay 73.0 and Lake Salda 81.4); the text is generated from actual sᵢ and w·u contributions. No "never studied", "first discovery" or "best analog" claim is made. For the Moon no exploratory candidate qualifies; that negative result is shown.

## Validation

`scripts/validate_results.py` runs **63 Python scientific tests** and independently recomputes saved shortlist, terrain metrics, F/U/C and eligible P. `npm run test:unit` runs **52 TypeScript scientific tests**. New review regressions cover active-model export parity, unknown-geology comparator gating, relative rank explanations, conditional eligibility, missing-terrain export, unit/period handling, raster/window integrity and bundled imagery hashes. Synthetic fixtures occur only in tests. The report is `data/derived/validation.json`; Zod validates data before display. Sixteen browser workflows cover desktop/mobile/print, active-state shared links, live terrain/imagery and provider failure.

## Review clarifications

Release3 Evidence Inspector exposes actual source values, units, acquisition periods, HTTP response hashes and calculation inputs. Its footprint figure is a schematic of native support at the selected latitude, not authoritative POWER pixel geometry or a mapped geology polygon. Fully assessed C remains distinct from evidence strength or independence. Reviewed cases are versioned with science releases: Saudi maps support a preliminary sedimentary question; Chile's granitic/intrusive mapping does not establish the required sedimentary mission process; Salda literature supplies direct shoreline process context but remains a benchmark. Multiple generalized maps may share source inputs. See each case's primary references and spatial scope; no field result is claimed.

What-if settings are now one persisted model shared across all views. Alpha, tolerances, weights and minimum coverage are included in packet metadata and Passport QR snapshots. Release dataset downloads retain default model results. Characterization and configurable ranking thresholds cannot be reduced below the original 70% evidence floor in the UI; geology remains essential even if its weight is zero.

"Fully assessed" Frontier comparators have all four model criteria assessed, rather than merely 70% weighted coverage. The incomplete candidate is excluded from its comparator pool. Rank-change text separates exact own-score contributions from relative movement caused by peers. Robustness rank median/IQR/best/worst are conditional on eligibility; eligibility share is explicit, and first/top-three shares use all 200 scenarios.

Transfer Lab density is a **calculation from climatological mean inputs**, not measured density. Dynamic pressure uses an adjustable **scenario wind** and is not observed mean dynamic pressure. A ratio/function of mean inputs generally differs from the mean of the nonlinear result. Dry-air gas constant and Mars/Moon approximations remain declared assumptions. Unknown units/inputs remain unavailable. Visualization-only context tiles reject unsupported pixels and time out to the cached lattice. Planetary context preprocessing verifies full-raster and extracted-window checksums before attaching provenance.
