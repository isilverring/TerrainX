import { describe, expect, it } from "vitest";
import {
  terrainMetrics,
  slopeGrid,
  surfaceFromTerrain,
  centreProfiles,
  hillshade,
  quantile,
} from "../terrain";
import { realDataset } from "./fixtures";

describe("TypeScript terrain metrics reproduce the Python pipeline", () => {
  it("matches every cached Earth and planetary metric", () => {
    const data = realDataset();
    const profiles = [
      ...data.candidates.map((c) => c.terrain),
      ...data.targets.map((t) => t.terrain),
    ];
    let checked = 0;
    for (const t of profiles) {
      const grid = surfaceFromTerrain(t);
      if (!grid || !t.metrics) continue;
      const m = terrainMetrics(grid, t.sample_spacing_m!);
      expect(m.median_slope_deg).toBeCloseTo(t.metrics.median_slope_deg, 9);
      expect(m.p90_slope_deg).toBeCloseTo(t.metrics.p90_slope_deg, 9);
      expect(m.relief_m).toBeCloseTo(t.metrics.relief_m, 6);
      expect(m.detrended_rms_m).toBeCloseTo(t.metrics.detrended_rms_m, 6);
      checked++;
    }
    expect(checked).toBe(22);
  });
  it("flat terrain has zero slope and roughness; planes have zero roughness", () => {
    const flat = Array.from({ length: 5 }, () => Array(5).fill(100));
    expect(terrainMetrics(flat, 10).median_slope_deg).toBe(0);
    expect(terrainMetrics(flat, 10).detrended_rms_m).toBeCloseTo(0, 9);
    const plane = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => 2 * c + 3 * r),
    );
    expect(terrainMetrics(plane, 10).detrended_rms_m).toBeCloseTo(0, 9);
    const s = slopeGrid(plane, 10).flat()[0]!;
    expect(s).toBeCloseTo((Math.atan(Math.hypot(0.2, 0.3)) * 180) / Math.PI, 9);
  });
  it("numpy-style linear quantile", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([0, 10], 0.95)).toBeCloseTo(9.5, 12);
  });
});

describe("missing terrain never creates a fabricated mesh (test 16)", () => {
  it("returns null for unavailable or incomplete grids", () => {
    expect(
      surfaceFromTerrain({ status: "unavailable", elevations_m: null }),
    ).toBeNull();
    expect(
      surfaceFromTerrain({ status: "available", elevations_m: null }),
    ).toBeNull();
    expect(
      surfaceFromTerrain({
        status: "available",
        elevations_m: [
          [1, null],
          [2, 3],
        ],
      }),
    ).toBeNull();
    expect(
      surfaceFromTerrain({ status: "available", elevations_m: [[1, 2], [3]] }),
    ).toBeNull();
  });
  it("passes real grids through unchanged", () => {
    const t = realDataset().targets[0].terrain;
    expect(surfaceFromTerrain(t)).toBe(t.elevations_m);
  });
  it("profiles and hillshade derive only from the given grid", () => {
    const g = [
      [3, 3, 3],
      [2, 2, 2],
      [1, 1, 1],
    ];
    const p = centreProfiles(g, 4000);
    expect(p.westEast.map((x) => x.z)).toEqual([2, 2, 2]);
    expect(p.southNorth.map((x) => x.z)).toEqual([1, 2, 3]);
    expect(p.southNorth[0].d).toBe(-4000);
    const h = hillshade(g, 4000);
    expect(h.flat().every((v) => v >= 0 && v <= 1)).toBe(true);
  });
});
