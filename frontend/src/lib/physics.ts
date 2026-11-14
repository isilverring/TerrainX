/**
 * Planetary Transfer Lab physics. Pure functions with explicit SI units.
 *
 * Classifications: OBSERVED (NASA POWER values), CALCULATED (derived here),
 * SCENARIO (declared illustrative assumptions), APPROXIMATION (documented simplification).
 */
import type { Candidate } from "./models";

export type Body = "earth" | "mars" | "moon";
/** Surface gravitational acceleration, m/s². Earth uses standard gravity (exact by definition). */
export const GRAVITY: Record<Body, number> = {
  earth: 9.80665,
  mars: 3.71,
  moon: 1.62,
};
export const BODY_NAME: Record<Body, string> = {
  earth: "Earth",
  mars: "Mars",
  moon: "Moon",
};
/** Specific gas constants, J/(kg·K). */
export const R_DRY_AIR = 287.05;
export const R_MARS_CO2 = 188.9;

function positive(name: string, v: number) {
  if (!Number.isFinite(v) || v <= 0)
    throw new Error(`${name} must be a positive finite number`);
}
function finite(name: string, v: number) {
  if (!Number.isFinite(v)) throw new Error(`${name} must be finite`);
}

/** Froude number Fr = v² / (g·L); v in m/s, g in m/s², L in m. Dimensionless. */
export function froude(v: number, g: number, L: number) {
  finite("Speed", v);
  positive("Gravity", g);
  positive("Characteristic length", L);
  return (v * v) / (g * L);
}
/** Speed on the target body with the same Froude number at the same L: v_t = v_e·√(g_t/g_e). */
export function froudeMatchedSpeed(
  vEarth: number,
  gTarget: number,
  gEarth = GRAVITY.earth,
) {
  finite("Speed", vEarth);
  positive("Target gravity", gTarget);
  positive("Earth gravity", gEarth);
  return vEarth * Math.sqrt(gTarget / gEarth);
}
/** Gravitational components for a mass on a slope: F∥ = m·g·sinθ, N = m·g·cosθ (newtons). */
export function slopeForces(massKg: number, g: number, slopeDeg: number) {
  positive("Mass", massKg);
  positive("Gravity", g);
  if (!(slopeDeg >= 0 && slopeDeg < 90))
    throw new Error("Slope must be in [0, 90) degrees");
  const t = (slopeDeg * Math.PI) / 180;
  return {
    parallelN: massKg * g * Math.sin(t),
    normalN: massKg * g * Math.cos(t),
    weightN: massKg * g,
  };
}
export function celsiusToKelvin(c: number) {
  finite("Temperature", c);
  const k = c + 273.15;
  if (k <= 0) throw new Error("Temperature below absolute zero");
  return k;
}
/** Converts a pressure to pascals using the source's own unit string. Unknown units are refused. */
export function pressureToPa(value: number, unit: string) {
  finite("Pressure", value);
  const u = unit.trim().toLowerCase();
  const factor: Record<string, number> = {
    pa: 1,
    hpa: 100,
    mb: 100,
    mbar: 100,
    kpa: 1000,
    bar: 1e5,
  };
  if (!(u in factor)) throw new Error(`Unrecognized pressure unit "${unit}"`);
  return value * factor[u];
}
/** Converts a temperature to kelvin using the source's unit string ("C", "°C", "K"). */
export function temperatureToK(value: number, unit: string) {
  const u = unit.replace("°", "").trim().toUpperCase();
  if (u === "C") return celsiusToKelvin(value);
  if (u === "K") {
    positive("Temperature", value);
    return value;
  }
  throw new Error(`Unrecognized temperature unit "${unit}"`);
}
/** Ideal-gas density ρ = p / (R_specific·T), kg/m³. p in Pa, T in K. */
export function gasDensity(pPa: number, tK: number, rSpecific: number) {
  if (!Number.isFinite(pPa) || pPa < 0)
    throw new Error("Pressure must be ≥ 0 Pa");
  positive("Temperature", tK);
  positive("Specific gas constant", rSpecific);
  return pPa / (rSpecific * tK);
}
/** Dynamic pressure q = ½·ρ·v², Pa. */
export function dynamicPressure(rho: number, v: number) {
  if (!Number.isFinite(rho) || rho < 0) throw new Error("Density must be ≥ 0");
  finite("Speed", v);
  return 0.5 * rho * v * v;
}
/** Speed on body B that gives the same dynamic pressure as speed v on body A. */
export function equalDynamicPressureSpeed(
  v: number,
  rhoA: number,
  rhoB: number,
) {
  if (rhoB <= 0) return null;
  return v * Math.sqrt(rhoA / rhoB);
}

export interface AtmosphereState {
  body: Body;
  classification: "OBSERVED" | "SCENARIO" | "APPROXIMATION";
  label: string;
  pressurePa: number | null;
  temperatureK: number | null;
  rSpecific: number | null;
  density: number | null;
  windSpeed: number | null;
  notes: string[];
}

/** Earth atmosphere at a candidate from NASA POWER PS, T2M and WS10M, honoring their units. */
export function earthAtmosphere(
  candidate: Candidate,
): AtmosphereState | { missing: string[]; reason: string } {
  const { PS, T2M, WS10M } = candidate.climate;
  const missing = [
    !PS || PS.value == null ? "PS (surface pressure)" : null,
    !T2M || T2M.value == null ? "T2M (2 m air temperature)" : null,
  ].filter((x): x is string => !!x);
  if (missing.length)
    return {
      missing,
      reason: `NASA POWER ${missing.join(" and ")} unavailable for this location; Earth density is not computed.`,
    };
  const pressurePa = pressureToPa(PS!.value!, PS!.unit);
  const temperatureK = temperatureToK(T2M!.value!, T2M!.unit);
  return {
    body: "earth",
    classification: "OBSERVED",
    label: `NASA POWER climatology at ${candidate.name} (2001–2025 means)`,
    pressurePa,
    temperatureK,
    rSpecific: R_DRY_AIR,
    density: gasDensity(pressurePa, temperatureK, R_DRY_AIR),
    windSpeed: WS10M?.value ?? null,
    notes: [
      `PS ${PS!.value} ${PS!.unit} → ${pressurePa.toFixed(0)} Pa`,
      `T2M ${T2M!.value} ${T2M!.unit} → ${temperatureK.toFixed(2)} K`,
      "Dry-air approximation R = 287.05 J/(kg·K); humidity is ignored.",
      "Annual-mean values; density varies with season and time of day.",
    ],
  };
}

/** Declared illustrative Mars scenario. NOT a Jezero measurement. */
export const MARS_SCENARIO: AtmosphereState = {
  body: "mars",
  classification: "SCENARIO",
  label: "Illustrative Mars scenario (assumption, not a Jezero measurement)",
  pressurePa: 600,
  temperatureK: 210,
  rSpecific: R_MARS_CO2,
  density: gasDensity(600, 210, R_MARS_CO2),
  windSpeed: null,
  notes: [
    "p = 600 Pa, T = 210 K, R = 188.9 J/(kg·K) (CO₂) are scenario assumptions.",
    "Real Martian surface pressure and temperature vary with elevation, season and time of day.",
  ],
};
/** The lunar exosphere is so tenuous that aerodynamic dynamic pressure is taken as ≈ 0. */
export const MOON_APPROXIMATION: AtmosphereState = {
  body: "moon",
  classification: "APPROXIMATION",
  label: "Moon: tenuous exosphere, aerodynamic dynamic pressure ≈ 0",
  pressurePa: 0,
  temperatureK: null,
  rSpecific: null,
  density: 0,
  windSpeed: null,
  notes: [
    "No wind-driven aerodynamic loads; dust is moved by other processes (e.g. impacts, electrostatics, exhaust plumes).",
  ],
};

export interface TransferGap {
  comparable: string[];
  scaling: string[];
  facilities: string[];
  unvalidated: string[];
}
/** Deterministic transfer-gap summary from declared templates and computed ratios. */
export function transferGap(
  target: "mars" | "moon",
  earthDensity: number | null,
): TransferGap {
  const g = GRAVITY[target] / GRAVITY.earth;
  const rhoRatio =
    target === "mars" && earthDensity
      ? earthDensity / (MARS_SCENARIO.density as number)
      : null;
  return {
    comparable: [
      "Broad terrain morphology on the same 24 km lattice (relative slope, relief, roughness; never absolute elevation).",
      "Field workflows: navigation, sampling protocols, documentation, localization and science operations.",
      target === "mars"
        ? "Sedimentary or aqueous processes where independently documented at the Earth subsite."
        : "Basaltic material and volcanic landforms where independently documented at the Earth subsite.",
    ],
    scaling: [
      `Vehicle dynamics: gravity is ${(g * 100).toFixed(0)} % of Earth's, so equal Froude number needs ${Math.sqrt(g).toFixed(2)}× the Earth speed at equal length.`,
      "Wheel–soil interaction (traction, sinkage, slip): controlled tests with regolith simulants, bevameters and gravity-offload rigs.",
      target === "mars"
        ? `Aeolian processes: with the illustrative scenario, Earth air here is ~${rhoRatio ? rhoRatio.toFixed(0) : "—"}× denser, so equal wind speed is not equal dynamic pressure; threshold studies need low-pressure wind tunnels.`
        : "Dust behavior: no wind on the Moon; dust mobility must be studied with vacuum, electrostatic and plume experiments.",
    ],
    facilities: [
      target === "mars"
        ? "Mars-environment chambers (~600 Pa CO₂, low temperature) for instruments, seals and dust."
        : "Thermal-vacuum chambers reproducing lunar vacuum and day–night thermal cycling.",
      "Radiation test facilities for electronics and materials.",
      "Reduced-gravity platforms (parabolic flights, drop towers, offloading rigs) for gravity-dependent mechanics.",
    ],
    unvalidated: [
      "Local mineralogy, grain size and bearing strength at the Earth subsite.",
      "Rover traction, sinkage, slip, wheel failure, safety and operational speed limits on the target body.",
      "Representativeness of annual-mean NASA POWER climatology for a specific field day.",
      "Any claim of planetary equivalence: no field campaign has been performed.",
    ],
  };
}
