# TerrainX scientific method and actual findings

Independent research prototype: no planetary equivalence, field verification, rover/landing safety certification or NASA approval is claimed.

## Actual release

130 valid NASA POWER grid cells;16 algorithmically shortlisted candidates;4 separately labelled benchmarks;20 POWER point profiles;20 real SRTM49-point terrain grids;2 real planetary DEM profiles;19 Macrostrat mapped-geology responses;no acquisition errors. Ten automatic candidates meet the declared default evidence gate for a preliminary mission-specific hypothesis. None is field-validated. No automatic candidate has established direct lunar-basalt relevance in the selected map evidence. This honest negative/unknown lunar result must not be replaced with assumed basalt.

“Discovered” means previously unshortlisted by this reproducible bounded search, not unknown to geological literature. Benchmark references are never counted as new discoveries.

## Two-stage geographic screening

| Region | Bounds [west,south,east,north] | Actual cells |
|---|---|---:|
| Western Saudi Arabia |[38,24,41,26]|25|
| Botswana dry basins |[24.5,-22,27.5,-19]|35|
| Northern Chile / Altiplano |[-70,-25,-67,-22]|35|
| Gobi |[101,42,104,45]|35|

Stage A retrieves one PRECTOTCORR parameter per regional request and preserves every cell. Actual meteorological centers follow0.5° latitude×0.625° longitude, rather than assuming the documentation example's nominal0.5° square grid. The mean daily rate must have mm/day units before conversion:

`Pannual=365.25×Pdaily`; `Sarid=clamp(1−Pannual/400,0,1)`.

400mm/year is an application assumption, not planetary precipitation equivalence. A public-domain Natural Earth110m broad land mask excludes coast/water-screened centers from selection while retaining them in the GeoJSON. It is approximate near coasts, not a field-scale coastline or access survey. Selection is descending aridity, latitude/longitude tie-breaks, up to4 per region, minimum65km separation.

Stage B retrieves point climate,SRTM terrain and mapped geology for the16 candidates plus4 benchmark subsites. A dry basin does not establish lake sediments,carbonate,mineral preservation,caves or habitability. Generic volcanic material is not automatically basalt.

## Earth observations and units

Actual POWER climatology period:2001–2025. Regional responses expose start/end;point responses expose the actual period through `header.range`. Both formats are parsed;unknown periods remain unavailable. PRECTOTCORR:mm/day;T2M:°C;WS10M:m/s;PS:kPa;RH2M:%;solar irradiance:**MJ/m²/day** for the queried AG community. Original returned units remain visible.

POWER combines gridded reanalysis and satellite-derived products. The UI's MEASURED label denotes the provider-reported observation product, not an instrument at an outcrop. Meteorological support is0.5°×0.625°;solar support is1°×1°. Seasonal range=max(monthly mean T2M)−min(monthly mean T2M);it is not a daily swing or planetary surface temperature.

SRTM90m via OpenTopoData is bilinearly sampled on7×7 points at4km spacing,24×24km center-to-center footprint. The≈90m source resolution is not the analysis spacing. Earth coordinate offsets use a6371000m spherical approximation with latitude-dependent longitude spacing;this is regional analysis,not a surveyed grid. Requests contain≤100 locations and are separated by≥1.05s;successful responses are cached. This run used20 SRTM requests,below the published1000/day limit. No fine boulder,cave or landing-hazard inference is made.

## Planetary DEMs: real and metadata-validated

Jezero18.45°N,77.45°E uses MOLA MEGDR16. Mare Crisium16.18°N,59.10°E uses LOLA LDEM16. Real global rasters are5760×2880 signed16-bit samples. Detached PDS metadata validate file dimensions,size,endian order,scale,units,projection,coordinates,pixel centers and source extrema before extraction.

- MOLA:big-endian;height in meters above the areoid;scale1.
- LOLA:little-endian;`height_m=DN×0.5` above the1737400m reference sphere. Do not add the radius to a height.
- PDS4 upper-left bounds validate pixel centers:lon=(col+0.5)/16;lat=90−(row+0.5)/16. PDS3 offset conventions differ between these products;one guessed formula is not applied to both.
- Longitude is0–360° east-positive. Local spherical offsets use the map sphere radius in each validated label. Exact native DNs used for interpolation are committed.
- Native N–S support is≈3704.46m(MOLA),1895.21m(LOLA);E–W support varies with latitude. Identical pixels/degree does not mean identical physical resolution.

Both targets have49 real samples on a4km lattice across24km,with bilinear interpolation and no additional smoothing. Broad MOLA cannot resolve detailed delta structure;neither profile resolves rover-scale rocks or mechanics.

## Terrain features and compatibility

`dz/dx=(zE−zW)/(2dx)`;`dz/dy=(zN−zS)/(2dy)`;`θ=atan(hypot(dz/dx,dz/dy))×180/π`.

Central differences use interior cells and physical meters.4km sample spacing means8km derivative baseline. Missing neighbors exclude derivatives. Require≥90% valid elevations and adequate interior slopes.

`H=Q95(z)−Q05(z)` in meters;`HL=H/L` dimensionless. Least-squares plane:`ẑ=ax+by+c`;detrended RMS:`R=√mean((z−ẑ)²)` in meters. R is coarse terrain variation,not centimeter-scale regolith roughness. Absolute elevations across unlike reference surfaces never enter similarity.

The scale gate requires real available profiles,provenance,required metrics,spacing/footprint within5%,and native pixels≤1.05×sample spacing. Failure gives F=null.

**Unequal native support remains:** common4km spacing does not harmonize≈90m Earth point samples with kilometer-scale planetary pixels. No matched area averaging is applied. Bilinear/source-team interpolation can bias scores. The app explicitly labels fidelity exploratory broad morphology and warns that it is not scale equivalence or mission-safety validation. A future study should test matched physical filtering,multiple baselines and tolerance sensitivity.

## Distinct F,U,C and optional P

`si=exp(−0.5((Ei−Pi)/τi)²)`;`F=100×weighted_mean(si)`. Equal weights across median slope,p90 slope,relief,detrended RMS. Illustrative tolerances:3°,5°,150m,75m. They are not calibrated NASA limits,instrument uncertainty or established equivalence standards. Contributions remain in the dataset.

`U=100×Σavailable(wk uk)/Σavailable(wk)`;`C=Σavailable(wk)`.

Unknown is null,never zero. Partial U can be high when geology is missing;its lower denominator and insufficient coverage are disclosed. C is assessed weight,not confidence,quality or probability. Rankings are Earth experiment suitability,not universal planetary similarity.

| Criterion | Jezero | Mare Crisium |
|---|---:|---:|
| Geological/process or basaltic relevance |.55|.55|
| Terrain fieldwork |.20|.30|
| Earth dry conditions |.15|.10|
| Earth thermal logistics |.10|.05|

All weights sum to1 and are adjustable in the UI with normalized controls/reset. Observations remain unchanged;U,C,status and eligible P update. Printed passports include active weights. Dataset downloads retain the original default release.

Geology:1 documented matching material/process;.5 partial evidence;0 documented mismatch;null unknown. Assessed scores carry sources and rationale. Broad sedimentary/possible carbonate context earns at most partial Jezero relevance without verified lake/preservation evidence. Original map scale classes,citations and source/map IDs remain available. A mapped lithology is not confirmed field mineralogy.

Published benchmark subsite evidence takes precedence over regional polygons:Salda's documented hydromagnesite shore must not gain lunar-basalt relevance from a coarse ophiolite polygon. Salda is a known reference,not a new discovery.

Terrain utility uses a bell preference for p90 slope centered3°(Mars) or5°(Moon),width5°. Thermal logistics uses `clamp(1−|Tannual−10°C|/40°C,0,1)`. These are explicit field-experiment assumptions,not planetary surface-temperature or rover-safety models. Characterized status requires C≥.70 and supported geology≥.5;it remains preliminary.

`P=(αF+(1−α)U)×C^γ`,with α=.30 Mars,.55 Moon,γ=1. Require F,U available,C≥.70 and assessed geology. No probability or mission approval is implied.

## Reality gap and experiment design

Every dossier separates MATCH,MISSION USE,MISMATCH,MISSING. Earth does not reproduce reduced gravity,Martian low-pressure CO₂ atmosphere,lunar vacuum,radiation,regolith mechanics,weathering,biology or water effects. `Fparallel=mg sinθ`, `N=mg cosθ` are simple force components,not wheel traction,sinkage,slip or cohesion models.

Deterministic experiment cards propose hypotheses,equipment,measurements,an explicitly proposed metadata-completeness indicator,next measurements and limits. No experiment has been performed and no outcome is invented. Local mineralogy,grain size,bearing strength,terrain,access,hazards and permits require field verification.

## Validation

`scripts/validate_results.py` runs48 scientific tests,then independently recomputes the saved shortlist,terrain metrics,F/U/C and eligible P. Coverage includes parsing,actual periods/units,fill values,batching/rate limits,analytic terrain,relative relief,scale rejection,missing planetary data,weights,geology gating,determinism,benchmark exclusion,provenance,PDS labels and longitude wrapping. Synthetic numerical arrays occur only in tests. The report is `data/derived/validation.json`. Frontend Zod validation runs before displaying scientific data;Playwright covers the complete desktop/mobile/print workflow.
