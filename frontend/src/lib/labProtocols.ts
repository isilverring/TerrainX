/**
 * Field-protocol templates for the eight Research Lab tools.
 *
 * A template turns a Research Lab question into a field test: what to measure, with what,
 * and what result would answer the question. Templates contain methods only — no
 * measured values — and every field stays editable. Applying one never changes the
 * candidate's F/U/C or any released observation.
 */
import { LAB_MODULES, type LabModule } from "./researchLab";
import type { FieldStudy } from "./fieldStudy";

export type LabProtocol = {
  objective: string;
  hypothesis: (site: string) => string;
  measurements: string[];
  equipment: string[];
  success: string;
  closes: string;
};

export const LAB_PROTOCOLS: Record<LabModule, LabProtocol> = {
  mineralogy: {
    objective:
      "Identify the mineral phases actually present, replacing mapped-unit context with sample evidence.",
    hypothesis: (s) =>
      `Samples from ${s} can establish whether mission-relevant mineral phases are present, absent or unresolved; mapped units alone do not establish composition.`,
    measurements: [
      "Grab and chip samples at each sample station, described in situ (colour, grain size, structures)",
      "Field VNIR or portable Raman spectra of fresh and weathered surfaces",
      "Laboratory XRD (bulk and clay fraction) on split samples",
      "Thin sections for texture and alteration where rock is coherent",
    ],
    equipment: [
      "Rock hammer, chisels, sample bags",
      "Portable VNIR/Raman spectrometer (if available)",
      "Spectral reference panel",
    ],
    success:
      "XRD and spectra identify the dominant phases at ≥ 2 stations and state whether the mission-relevant phases are present, absent or ambiguous.",
    closes: "Geology, mineralogy and surface materials",
  },
  illumination: {
    objective:
      "Measure local thermal and solar conditions to test the climatology and solar-geometry model.",
    hypothesis: (s) =>
      `Shielded 2 m air-temperature logs at ${s} can quantify differences from the 2025 POWER grid-cell envelope. Ground temperature and irradiance require separate comparisons.`,
    measurements: [
      "Air and ground-surface temperature at 10-minute intervals for ≥ 7 days",
      "Global horizontal irradiance with a pyranometer over the same period",
      "Horizon (sky-view) photographs at each station to check terrain shading",
    ],
    equipment: [
      "Shielded temperature loggers (air + surface)",
      "Pyranometer and data logger",
      "Fisheye or compass-clinometer for horizon profiles",
    ],
    success:
      "Compare only like observables: 2 m air daily minima/maxima with the 2025 POWER envelope; horizon angles with solar geometry. Report ground temperature and irradiance separately. One year is not a long-term extreme baseline.",
    closes: "Temperature, illumination and environmental extremes",
  },
  resources: {
    objective:
      "Measure near-surface water and frozen ground instead of relying on modelled wetness or stability indices.",
    hypothesis: (s) =>
      `Depth-resolved measurements at ${s} can establish water content and temperature. The dimensionless model wetness index is contextual, not an equivalent water-content or ice measurement.`,
    measurements: [
      "Volumetric water content profiles to 30 cm (TDR or gravimetric)",
      "Ground temperature profile to ≥ 1 m for seasonal context; permafrost requires evidence of ground at or below 0 °C for at least two consecutive years",
      "Sample moisture loss on drying for calibration",
    ],
    equipment: [
      "TDR soil-moisture probe or sealed sample tins + balance",
      "Thermistor string or probe thermometer",
      "Hand auger",
    ],
    success:
      "Measured water content (and any frozen layer) is reported per station with method and depth; modelled indices are compared, not substituted.",
    closes: "Water, ice, permafrost and resources",
  },
  dust: {
    objective:
      "Estimate the local threshold for grain motion from measured wind profiles and surface grain sizes.",
    hypothesis: (s) =>
      `Friction velocities measured at ${s} exceed the Shao–Lu threshold for the measured grain size on some days.`,
    measurements: [
      "Wind speed at two or three heights (log-law friction velocity u*)",
      "Passive sand/dust traps (e.g. BSNE) at 10 and 50 cm",
      "Surface grain-size distribution by dry sieving",
    ],
    equipment: [
      "Cup anemometers on a mast with logger",
      "Passive sediment traps",
      "Sieve stack and scale",
    ],
    success:
      "u* time series, trap mass flux and grain size are compared with the Shao–Lu scenario; threshold exceedances are counted.",
    closes: "Dust, wind, erosion, atmospheric processes",
  },
  biology: {
    objective:
      "Test whether a biosignature assay separates a real signal from contamination at this site.",
    hypothesis: (s) =>
      `Replicate assays of aseptically collected samples from ${s} can distinguish a sample signal from procedural blanks when positive controls recover and detection limits are quantified.`,
    measurements: [
      "Aseptic samples at surface and 5–10 cm, with field blanks at every station",
      "Positive-control spikes carried through extraction",
      "ATP, DNA yield and/or organic-carbon assays in the laboratory",
    ],
    equipment: [
      "Sterile scoops, Whirl-Pak bags, gloves, ethanol",
      "Cold chain (≤ 4 °C) and chain-of-custody forms",
      "Blank and spiked control materials",
    ],
    success:
      "Blanks are clean, controls recover, and site signals are reported with detection limits; no habitability claim is made from GBIF counts.",
    closes: "Biology, extremophiles, habitability, biosignatures",
  },
  caves: {
    objective:
      "Use a documented cave or lava tube to test subsurface mapping and microclimate methods.",
    hypothesis: (s) =>
      `If an independently documented and accessible cave is verified for a campaign associated with ${s}, its geometry and microclimate can be compared with exterior conditions. No cave at this candidate is inferred.`,
    measurements: [
      "Confirm the documented entrance location and access permission before entry",
      "Survey passage geometry (LiDAR or total station) from the entrance",
      "Log temperature, humidity and CO₂ inside vs outside for ≥ 48 h",
    ],
    equipment: [
      "Helmets, lights and cave-safety kit (trained team only)",
      "Handheld LiDAR or survey instruments",
      "Microclimate loggers",
    ],
    success:
      "A georeferenced passage map and paired inside/outside time series exist; host-rock proxies are not treated as cave evidence.",
    closes: "Caves, lava tubes, subsurface",
  },
  operations: {
    objective:
      "Survey the proposed corridor before any vehicle test, then compare measured terrain with the coarse route model.",
    hypothesis: (s) =>
      `A field survey at ${s} can reveal slope, surface and obstacle constraints omitted by the coarse route lattice. Traversability remains unvalidated until independently assessed.`,
    measurements: [
      "Survey an independently cleared corridor; collect GNSS positions and timestamps without treating the computed route as clearance",
      "Slope and roughness at each station (clinometer, photo scale)",
      "Time, energy or effort per leg compared with the estimate",
    ],
    equipment: ["GNSS receiver", "Compass-clinometer", "Camera with scale bar"],
    success:
      "Measured slopes and traverse times are tabulated against the route model; any leg exceeding limits is flagged.",
    closes: "Landing, mobility, navigation, robotic and human operations",
  },
  base: {
    objective:
      "Rehearse illumination-limited surface operations on Earth using the lunar trade-off as the operating constraint.",
    hypothesis: (s) =>
      `Operations at ${s} scheduled to a lunar-like illumination and power budget can complete the planned tasks.`,
    measurements: [
      "Solar-panel output at low incidence angles through the day",
      "Task timeline versus available power and daylight window",
      "Terrain and line-of-sight checks for communications and navigation",
    ],
    equipment: [
      "Small PV panel with power logger",
      "Timeline sheets",
      "Radio or line-of-sight test kit",
    ],
    success:
      "The task timeline closes (or fails) within the declared power budget; lunar values are scenario inputs, not Earth measurements.",
    closes: "Permanent Moon-base locations",
  },
};

export const isLabModule = (v: string | null): v is LabModule =>
  !!v && LAB_MODULES.some((m) => m.id === v);
export const labTitle = (m: LabModule) =>
  LAB_MODULES.find((x) => x.id === m)!.title;

/** Applies a Research Lab template to a fresh study; existing equipment is kept, duplicates skipped. */
export function applyLabProtocol(
  study: FieldStudy,
  module: LabModule,
  siteName: string,
): FieldStudy {
  const p = LAB_PROTOCOLS[module];
  const have = new Set(study.equipment.map((e) => e.text));
  return {
    ...study,
    lab_module: module,
    hypothesis: p.hypothesis(siteName),
    objective: p.objective.slice(0, 400),
    measurements: p.measurements.map((text) => ({ text, done: false })),
    equipment: [
      ...p.equipment
        .filter((t) => !have.has(t))
        .map((text) => ({ text, done: false })),
      ...study.equipment,
    ].slice(0, 40),
    success_indicators: p.success,
  };
}
