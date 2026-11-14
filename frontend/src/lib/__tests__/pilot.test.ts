import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { pilotSchema, pilotRange } from "../pilot";
describe("real common-support pilot contract", () => {
  const raw = JSON.parse(
    readFileSync(
      new URL("../../../public/data/terrain_pilot.json", import.meta.url),
      "utf8",
    ),
  );
  it("validates all 40 source-grounded scenarios and separate benchmarks", () => {
    const pilot = pilotSchema.parse(raw);
    expect(pilot.results.flatMap((r) => r.scenarios)).toHaveLength(40);
    expect(pilot.results.filter((r) => r.benchmark)).toHaveLength(2);
    for (const r of pilot.results) {
      expect(r.earth_sources.some((s) => s.kind === "DEM")).toBe(true);
      expect(pilotRange(r.scenarios)?.min).toBeGreaterThan(0);
    }
  });
  it("rejects fictional numeric gaps and malformed grids", () => {
    const bad = structuredClone(raw);
    bad.results[0].scenarios[0].earth.elevations_m[0].pop();
    expect(pilotSchema.safeParse(bad).success).toBe(false);
    const scenarios = raw.results[0].scenarios.map((s: object) => ({
      ...s,
      fidelity: { value: null, reason: "Unavailable" },
    }));
    expect(pilotRange(scenarios)).toBe(null);
  });
});
