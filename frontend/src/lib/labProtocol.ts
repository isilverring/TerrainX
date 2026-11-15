import { z } from "zod";
import type { Candidate, Mission } from "./models";
export const labProtocolSchema = z.enum([
  "mineralogy",
  "illumination",
  "resources",
  "dust",
  "biology",
  "caves",
  "operations",
  "base",
]);
export type LabProtocol = z.infer<typeof labProtocolSchema>;
export function labProtocol(
  id: LabProtocol,
  candidate: Candidate,
  mission: Mission,
) {
  const missionGoal =
    mission === "jezero"
      ? "Jezero-oriented sedimentary/geological field science"
      : "lunar surface-operations and geological workflows";
  const definitions = {
    mineralogy: {
      question:
        "Georeferenced samples can test whether mapped material/process relevance holds at the proposed subsite.",
      equipment: [
        "Georeferenced sampling log and chain-of-custody materials",
        "Calibrated XRF/reference materials; XRD or Raman laboratory access",
        "Microscopy/petrology and field stratigraphic log",
      ],
      measurements: [
        "Record exact sample position, depth, date and geological context",
        "Identify mineral phases with XRD/Raman; report method and detection limits",
        "Report nonoverlapping composition/phase fractions, replicates and reference-material results",
        "Keep mapped lithology separate from tested sample identity",
      ],
      success:
        "Report repeatability and mineral/material identification against predeclared instrument uncertainty; only source-scoped samples support a material claim.",
    },
    illumination: {
      question:
        "A dated Earth station campaign can characterize the lighting/thermal operating envelope required by the mission experiment.",
      equipment: [
        "Calibrated air, surface and subsurface temperature loggers",
        "Pyranometer/photodiode with calibration record and sky camera",
        "Surveyed station geometry, clocks and horizon survey",
      ],
      measurements: [
        "Record separate air, rock/surface and subsurface temperature time series",
        "Measure irradiance/lighting and local horizon with timestamps and uncertainty",
        "Compare campaign readings to the stated POWER year/climatology without treating them as the same support",
        "Test declared lighting outage and sensor operating scenarios in a controlled setup",
      ],
      success:
        "Quantify sensor agreement, outage duration and workflow continuity against predeclared targets; do not infer an exact lunar/Martian thermal analogy.",
    },
    resources: {
      question:
        "A controlled sample/thermal protocol can distinguish resource evidence from a stability proxy and quantify recovery losses.",
      equipment: [
        "Calibrated balance and sealed sample chain of custody",
        "Permitted depth-resolved thermal sensors",
        "Cold/vacuum facility where the hypothesis requires it",
        "Direct water/ice assay and contamination blanks",
      ],
      measurements: [
        "Measure starting sample mass and directly assayed water/ice mass fraction",
        "Record sample depth, temperature, pressure and time throughout handling",
        "Measure recovered water mass, blanks, losses and repeatability",
        "Keep any LCROSS-inspired mixture explicitly a scenario, not a local observation",
      ],
      success:
        "Close the mass balance within a predeclared uncertainty budget and report recovery efficiency; no reserve/abundance claim follows without representative sampling and geometry.",
    },
    dust: {
      question:
        "Measured grains, cohesion and boundary-layer conditions can test the applicability of a declared wind-entrainment model.",
      equipment: [
        "Particle-size/density characterization and moisture sensors",
        "Surface roughness survey and calibrated wind profile/shear measurement",
        "Erosion/deposition collectors and instrument contamination coupons",
      ],
      measurements: [
        "Measure particle-size distribution, material density, crust/cohesion and moisture",
        "Measure near-surface shear or a height-resolved wind profile with uncertainty",
        "Record movement initiation and sediment mass/deposition under repeated controlled conditions",
        "Compare friction velocity to the declared model; do not substitute10m mean wind or AOD as surface dust",
      ],
      success:
        "Report repeatable initiation/deposition thresholds and model discrepancies under the measured setup, not a dust-storm forecast.",
    },
    biology: {
      question:
        "A controlled sampling and assay workflow can separate a reproducible signal from field/process contamination.",
      equipment: [
        "Permitted sterile sampling materials and traceable chain of custody",
        "Field, process and reagent blanks plus positive reference controls",
        "Calibrated assay instrument and independent identification method",
        "Depth/temperature/moisture logging",
      ],
      measurements: [
        "Predeclare sampling location/depth, storage and processing conditions",
        "Collect at least2 sample replicates and3 blank signals for the declared demonstration rule",
        "Measure positive-control expected/measured response and recovery",
        "Report raw signal units, calibration, background, detection limits and uncertainty",
        "Use an independent molecular/microscopy/mineral-context method before biological interpretation",
        "Distinguish fresh in-situ observations from incubated or otherwise processed laboratory samples",
      ],
      success:
        "Controls and replicate consistency meet predeclared analytical limits. A signal above a blank rule alone does not establish indigenous life, habitability or sterility.",
    },
    caves: {
      question:
        "A permitted, surveyed cave-reference campaign can test localization and sensor workflows across subsurface lighting transitions.",
      equipment: [
        "Approved non-contact LiDAR/photogrammetry and surveyed control points",
        "Calibrated illumination, temperature and humidity sensors",
        "Custodian-approved communications and contamination controls",
      ],
      measurements: [
        "Verify authoritative access and obtain a surveyed entrance/interior origin",
        "Record relative stations against the survey, never an invented entrance waypoint",
        "Measure localization error, mapping repeatability and light/thermal transitions",
        "Document route/roof conditions through the appropriate qualified survey before any operations",
      ],
      success:
        "Report localization/mapping repeatability and sensor uncertainty against a predeclared target. No cave detection at an unverified Earth cell or planetary shielding/stability equivalence is inferred.",
    },
    operations: {
      question:
        "A finer field survey can test whether a proposed sampled-terrain graph route supports the navigation experiment.",
      equipment: [
        "Differential GNSS and permitted drone photogrammetry/terrestrial LiDAR",
        "Obstacle/access survey and soil-strength characterization",
        "Instrumented supervised mobility test platform where authorized",
      ],
      measurements: [
        "Survey proposed legs at a resolution appropriate to the platform",
        "Measure slopes, obstacles, access, bearing strength and navigation error",
        "Record wheel slip/sinkage and traverse performance only in an authorized controlled test",
        "Compare measured route geometry to the stated250m or4km analysis lattice and declared slope cost",
      ],
      success:
        "Report geometric/navigation errors and model failures against predeclared experiment limits. A graph path is not a safe route, landing zone or wheel-soil certification.",
    },
    base: {
      question:
        "A controlled Earth operations rehearsal can test workflows under a declared lunar lighting-outage and terrain scenario.",
      equipment: [
        "Measured terrain survey and instrumented navigation workflow",
        "Programmable lighting/power load and calibrated energy logging",
        "Thermal sensors; cold/vacuum/reduced-gravity facilities where required",
      ],
      measurements: [
        "Retain the actual selected lunar reference and stated2025illumination/LOLA support",
        "Predeclare load, outage duration, storage assumptions and success criteria",
        "Measure workflow continuity, energy balance, temperature and navigation repeatability",
        "Obtain finer/full-cycle lunar illumination, actual access evidence and direct resource measurements before engineering selection",
      ],
      success:
        "Demonstrate the stated terrestrial workflow against declared outage/navigation targets; no permanent-base certification, resource reserve or full planetary physical transfer is claimed.",
    },
  } as const;
  const p = definitions[id];
  return {
    id,
    hypothesis: `At ${candidate.name}, ${p.question}`,
    objective: `Test ${missionGoal} through the ${id} research protocol; stations and outcomes are proposed.`,
    equipment: [...p.equipment],
    measurements: [...p.measurements],
    success: p.success,
  };
}
