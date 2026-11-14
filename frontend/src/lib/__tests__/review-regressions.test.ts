import { describe, expect, it } from "vitest";
import { realDataset } from "./fixtures";
import { applyScenarios, validScenario } from "../scoring";
import { defaultScenario, explain, robustness } from "../counterfactual";
import { buildPacket, packetGeoJSON } from "../packet";
import { frontier } from "../frontier";
import { earthAtmosphere } from "../physics";
import { supportedTerrainPixel } from "../earthContext";

describe("review regressions: active model and missing evidence", () => {
  it("carries nondefault model settings into dossiers and all packet scores", () => {
    const raw = realDataset();
    const s = {
      ...defaultScenario("jezero"),
      alpha: 0.85,
      minCoverage: 0.9,
      weights: { geology: 0.4, terrain: 0.35, aridity: 0.15, temperature: 0.1 },
      tolerances: {
        median_slope_deg: 1.5,
        p90_slope_deg: 2.5,
        relief_m: 200,
        detrended_rms_m: 50,
      },
    };
    const data = applyScenarios(raw, {
      jezero: s,
      "mare-crisium": defaultScenario("mare-crisium"),
    });
    const c = data.candidates.find((x) => x.id === "saudi-24.000-39.375")!;
    const p = buildPacket(data, c, "jezero");
    expect(p.reproducibility.model).toEqual({
      weights: s.weights,
      alpha: s.alpha,
      gamma: s.gamma,
      minimum_coverage: s.minCoverage,
      tolerances: s.tolerances,
    });
    expect(p.scores.F).toBe(c.assessments.jezero.fidelity.value);
    expect(p.scores.P).toBe(c.assessments.jezero.priority);
    expect(p.scores.F).not.toBe(
      raw.candidates.find((x) => x.id === c.id)!.assessments.jezero.fidelity
        .value,
    );
    expect(raw.candidates[0].assessments.jezero.alpha).toBe(0.3);
    expect(validScenario(s)).toBe(true);
    expect(validScenario({ ...s, minCoverage: Number.NaN })).toBe(false);
  });
  it("unknown lunar geology remains unknown even at high weighted coverage", () => {
    const s = {
      ...defaultScenario("mare-crisium"),
      weights: { geology: 0.2, terrain: 0.5, aridity: 0.2, temperature: 0.1 },
    };
    const data = applyScenarios(realDataset(), {
      jezero: defaultScenario("jezero"),
      "mare-crisium": s,
    });
    for (const row of frontier(data.candidates, "mare-crisium")) {
      expect(row.bounds.coverage).toBeCloseTo(0.8);
      expect(row.rankRange.of).toBe(1);
      expect(row.benchmark?.name).not.toContain("Salda");
      expect(row.candidate.assessments["mare-crisium"].priority).toBeNull();
    }
  });
  it("reports peer-driven rank losses separately from an improving own score", () => {
    const s = defaultScenario("jezero");
    const row = explain(realDataset().candidates, "jezero", s, {
      ...s,
      alpha: 0.1,
    }).find((x) => x.id === "gobi-42.500-101.875")!;
    expect(row.pDelta!).toBeGreaterThan(0);
    expect(row.rankDelta!).toBeLessThan(0);
    expect(row.sentence).toContain("peers overtook it");
    expect(row.sentence).toContain("Its own P changed by +");
  });
  it("exposes scenarios omitted from conditional rank intervals", () => {
    const c = structuredClone(
      realDataset().candidates.find((x) => x.id === "saudi-24.000-39.375")!,
    );
    c.assessments.jezero.utility.criteria.temperature.value = null;
    const result = robustness(
      [c],
      "jezero",
      { ...defaultScenario("jezero"), minCoverage: 0.9 },
      { seed: 7 },
    );
    expect(result.stats[0].eligibleShare).toBeGreaterThan(0);
    expect(result.stats[0].eligibleShare).toBeLessThan(1);
    expect(result.stats[0].eligibleScenarios).toBe(
      result.stats[0].ranks.length,
    );
    expect(result.stats[0].firstShare).toBe(result.stats[0].eligibleShare);
  });
  it("never invents a terrain footprint when only coordinates are available", () => {
    const c = structuredClone(realDataset().candidates[0]);
    c.terrain = { status: "unavailable" };
    const p = buildPacket(realDataset(), c, "jezero");
    expect(packetGeoJSON(p).features).toHaveLength(1);
    expect(packetGeoJSON(p).features[0].geometry.type).toBe("Point");
  });
  it("uses the actual source period, converts wind units and refuses unsupported units", () => {
    const c = structuredClone(realDataset().candidates[0]);
    c.climate.PS!.provenance.period = [1991, 2020];
    c.climate.WS10M = { ...c.climate.WS10M!, value: 36, unit: "km/h" };
    const a = earthAtmosphere(c);
    if (!("density" in a)) throw new Error(a.reason);
    expect(a.label).toContain("1991–2020");
    expect(a.windSpeed).toBe(10);
    expect(a.classification).toBe("DERIVED");
    c.climate.PS!.unit = "unknown";
    expect("missing" in earthAtmosphere(c)).toBe(true);
  });
  it("refuses transparent and out-of-range terrain pixels", () => {
    expect(
      supportedTerrainPixel(new Uint8ClampedArray([128, 100, 0, 255]), 0),
    ).toBe(100);
    expect(() =>
      supportedTerrainPixel(new Uint8ClampedArray([128, 100, 0, 0]), 0),
    ).toThrow(/missing/);
    expect(() =>
      supportedTerrainPixel(new Uint8ClampedArray([0, 0, 0, 255]), 0),
    ).toThrow(/missing/);
  });
});
