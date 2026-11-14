import { describe, expect, it } from "vitest";
import {
  GRAVITY,
  froude,
  froudeMatchedSpeed,
  slopeForces,
  celsiusToKelvin,
  temperatureToK,
  pressureToPa,
  gasDensity,
  dynamicPressure,
  earthAtmosphere,
  equalDynamicPressureSpeed,
  MARS_SCENARIO,
  MOON_APPROXIMATION,
  R_DRY_AIR,
  transferGap,
} from "../physics";
import { realDataset } from "./fixtures";

describe("Froude scaling", () => {
  it("1. computes Fr = v²/(gL)", () => {
    expect(froude(2, 9.80665, 1)).toBeCloseTo(4 / 9.80665, 12);
    expect(froude(0, 3.71, 0.5)).toBe(0);
    expect(() => froude(1, 0, 1)).toThrow();
    expect(() => froude(1, 9.8, 0)).toThrow();
  });
  it("2. matched speed preserves Fr at fixed L", () => {
    for (const body of ["mars", "moon"] as const) {
      const vE = 0.8,
        L = 0.4;
      const vT = froudeMatchedSpeed(vE, GRAVITY[body]);
      expect(vT).toBeCloseTo(vE * Math.sqrt(GRAVITY[body] / GRAVITY.earth), 12);
      expect(froude(vT, GRAVITY[body], L)).toBeCloseTo(
        froude(vE, GRAVITY.earth, L),
        12,
      );
    }
  });
  it("3. gravity constants are SI m/s² with the declared values", () => {
    expect(GRAVITY).toEqual({ earth: 9.80665, mars: 3.71, moon: 1.62 });
    expect(GRAVITY.moon).toBeLessThan(GRAVITY.mars);
    expect(GRAVITY.mars).toBeLessThan(GRAVITY.earth);
  });
  it("4. slope components follow m·g·sinθ and m·g·cosθ", () => {
    const f = slopeForces(100, GRAVITY.mars, 30);
    expect(f.parallelN).toBeCloseTo(100 * 3.71 * 0.5, 9);
    expect(f.normalN).toBeCloseTo(100 * 3.71 * Math.cos(Math.PI / 6), 9);
    expect(Math.hypot(f.parallelN, f.normalN)).toBeCloseTo(f.weightN, 9);
    expect(slopeForces(50, 9.80665, 0).parallelN).toBe(0);
    expect(() => slopeForces(50, 9.8, 90)).toThrow();
  });
});

describe("atmosphere", () => {
  it("5. converts Celsius to Kelvin", () => {
    expect(celsiusToKelvin(0)).toBeCloseTo(273.15, 12);
    expect(celsiusToKelvin(-40)).toBeCloseTo(233.15, 12);
    expect(temperatureToK(25, "C")).toBeCloseTo(298.15, 12);
    expect(temperatureToK(25, "°C")).toBeCloseTo(298.15, 12);
    expect(temperatureToK(210, "K")).toBe(210);
    expect(() => celsiusToKelvin(-300)).toThrow();
  });
  it("6. converts kPa to Pa from the unit string and refuses unknown units", () => {
    expect(pressureToPa(101.325, "kPa")).toBeCloseTo(101325, 9);
    expect(pressureToPa(1013.25, "hPa")).toBeCloseTo(101325, 9);
    expect(pressureToPa(600, "Pa")).toBe(600);
    expect(() => pressureToPa(1, "psi")).toThrow();
  });
  it("ideal-gas density at standard conditions is ~1.225 kg/m³", () => {
    expect(gasDensity(101325, 288.15, R_DRY_AIR)).toBeCloseTo(1.225, 3);
  });
  it("7. dynamic pressure is proportional to v²", () => {
    const q1 = dynamicPressure(1.2, 5),
      q2 = dynamicPressure(1.2, 10);
    expect(q1).toBeCloseTo(0.5 * 1.2 * 25, 12);
    expect(q2 / q1).toBeCloseTo(4, 12);
  });
  it("8. dynamic pressure is zero when gas density is zero (Moon)", () => {
    expect(dynamicPressure(0, 30)).toBe(0);
    expect(MOON_APPROXIMATION.density).toBe(0);
    expect(equalDynamicPressureSpeed(10, 1.2, 0)).toBeNull();
  });
  it("uses real NASA POWER units for Earth", () => {
    const c = realDataset().candidates[0];
    const atm = earthAtmosphere(c);
    expect("density" in atm).toBe(true);
    if ("density" in atm) {
      expect(c.climate.PS!.unit).toBe("kPa");
      expect(atm.pressurePa).toBeCloseTo(c.climate.PS!.value! * 1000, 9);
      expect(atm.temperatureK).toBeCloseTo(c.climate.T2M!.value! + 273.15, 9);
      expect(atm.classification).toBe("OBSERVED");
      expect(atm.density!).toBeGreaterThan(0.8);
      expect(atm.density!).toBeLessThan(1.4);
    }
  });
  it("9. missing NASA POWER pressure is reported, never filled", () => {
    const c = structuredClone(realDataset().candidates[0]);
    delete c.climate.PS;
    const atm = earthAtmosphere(c);
    expect("missing" in atm).toBe(true);
    if ("missing" in atm) expect(atm.missing[0]).toMatch(/PS/);
    const c2 = structuredClone(realDataset().candidates[0]);
    c2.climate.T2M = { ...c2.climate.T2M!, value: null };
    expect("missing" in earthAtmosphere(c2)).toBe(true);
  });
  it("10. hypothetical planetary scenarios are visibly labelled", () => {
    expect(MARS_SCENARIO.classification).toBe("SCENARIO");
    expect(MARS_SCENARIO.label).toMatch(/scenario/i);
    expect(MARS_SCENARIO.label).toMatch(/not a Jezero measurement/);
    expect(MARS_SCENARIO.density).toBeCloseTo(600 / (188.9 * 210), 12);
    expect(MOON_APPROXIMATION.classification).toBe("APPROXIMATION");
  });
  it("transfer-gap text uses computed ratios", () => {
    const gap = transferGap("moon", null);
    expect(gap.scaling[0]).toContain(
      `${((1.62 / 9.80665) * 100).toFixed(0)} %`,
    );
    expect(gap.unvalidated.join(" ")).toMatch(/no field campaign/);
  });
});
