# TerrainX — Prompt 1 audit and enhancement plan

Written 2026-11-14 when the work moved from the PC (`D:\TerrainX`) to the laptop (`C:\TerrainX`).
The Prompt 1 Definition of Done is met (see STATUS.md). This file lists the **enhancements and fixes**
that come next. The original prompt asks for satellite imagery, 3D wherever possible, and UI/UX polish.
Tick items off and keep scientific rules intact: real data only, nulls stay null, and visualisation-only data
is never used for scoring.

## A. Satellite imagery
- [ ] Basemap switcher with Dark (Esri Dark Gray), **Satellite (Esri World Imagery)**, and **NASA GIBS true colour**.
      Include a date picker for GIBS (MODIS Terra/Aqua and VIIRS SNPP CorrectedReflectance, `GoogleMapsCompatible_Level9`).
- [ ] Optional NASA GIBS relief/thematic overlays where a 3857 layer exists (for example `BlueMarble_ShadedRelief_Bathymetry`).
- [ ] Every imagery layer shows its source, date and native zoom limit. Keep the local Natural Earth fallback.
- [ ] Imagery is for interpretation only and does not establish mineralogy. Keep that caveat.

## B. 3D
- [ ] **Earth 3D terrain** in MapLibre: `raster-dem` from AWS Terrain Tiles (terrarium encoding, public, no key,
      `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`), plus `setTerrain` with exaggeration,
      a hillshade layer, pitch/bearing controls, a "3D" toggle and sky/atmosphere.
      Fly to the selected candidate at a pitch of about 60°.
- [ ] **Globe projection** (MapLibre ≥5 `projection: globe`) for the world overview, switching to Mercator when zoomed in.
- [ ] Draw each candidate's **24 × 24 km SRTM analysis footprint** and the 0.5° × 0.625° POWER cell. Make the scale distinction visible.
- [ ] **Planetary 3D viewer**: extend `scripts/build_planetary_profiles.py` so it also exports a larger *visualisation-only*
      MOLA/LOLA context patch (e.g. 65 × 65 native pixels) around Jezero and Mare Crisium. Render the Earth SRTM grid and
      the planetary grid as side-by-side shaded 3D surfaces at the same horizontal scale and vertical exaggeration.
      Optionally drape a NASA Trek / CTX / LRO WAC image tile after verifying its URL and licence.
- [ ] The 3D surface must label vertical exaggeration and point out that absolute Earth and planetary elevations are not comparable.

## C. UX / visual fixes found in the audit
1. Ranking puts **"Insufficient evidence" (C = 45 %) candidates first** because the list sorts by U only. Add a sort control
   (U / C / F / P). Group by status: characterized first, then screened. Never hide that U is partial.
2. The map opens at zoom 1.25 over the whole world, so the markers are tiny. Fit to the study-region bounds instead
   and draw the four study-region boxes.
3. Markers are destroyed and recreated on every selection (flicker, perf). Create them once and toggle classes.
   Add rank numbers and hover tooltips.
4. Mobile: the layer and legend panels cover much of the small map. Merge them into one collapsible control.
5. The results list cuts the last visible card in half. The selected-summary panel has no F/U/C at a glance.
6. Source-status rows always show a ✓ icon, even when a source is unavailable. The icon must follow the status.
7. `localStorage.setItem` is not wrapped in try/catch, so it throws in private/embedded contexts.
8. The Mars button uses a generic circle icon. Give Mars and the Moon distinct glyphs.
9. Landing: replace the flat globe illustration with a live (slowly rotating) globe that shows the real candidate
   points and the headline counts from `dataset.json`.
10. Add a **compare mode** for 2–3 candidates (F/U/C, terrain metrics, climate, geology side by side).
11. Add a candidate search box and keyboard navigation (↑/↓) through the results list.
12. Passport: add a QR/URL footer and a print check for page breaks.

## D. Environment notes
- Laptop path is `C:\TerrainX`. The PC path is `D:\TerrainX`. Both are clones of `isilverring/TerrainX` `main`.
- On a fresh machine: `git clone https://github.com/isilverring/TerrainX C:\TerrainX`, then `npm --prefix frontend ci`,
  then `npm run dev`. For science checks: `py -3.12 -m venv .venv`, `.venv\Scripts\pip install -r requirements-lock.txt`,
  then `.venv\Scripts\python scripts\validate_results.py`.
- Claude cloud sessions need **package-manager network access** (claude.ai → Settings → Capabilities) to run
  `npm ci` and build or screenshot the app. Without it they can only edit code and rely on GitHub CI.
