import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assayQuality,
  autonomyWh,
  baseTradeoffs,
  caveStations,
  challengeEvidenceSchema,
  compositionClosure,
  dustThreshold,
  earthSolar,
  frictionVelocity10m,
  illuminationSchema,
  operationsSchema,
  parseReplicates,
  resourceRecovery,
  routeCoordinates,
  terrainRoute,
} from "../researchLab";
const read = (name: string) =>
  JSON.parse(
    readFileSync(resolve(__dirname, "../../../public/data/" + name), "utf8"),
  );
describe("partial-dimension research contracts", () => {
  it("validates all actual source records without filling entrance coordinates", () => {
    const p = challengeEvidenceSchema.parse(read("challenge_evidence.json"));
    expect(p.records).toHaveLength(9);
    expect(
      p.records.filter((r) => r.categories.includes("caves")),
    ).toHaveLength(3);
    expect(
      p.records.find((r) => r.id === "salda-l1-xrd-2026")!.latitude,
    ).toBeNull();
    expect(
      p.records.find((r) => r.id === "yungay-pit-biosignatures-2020")!
        .observations[0].method,
    ).toContain("incubation");
  });
  it("validates all real geometry and operations products", () => {
    const light = illuminationSchema.parse(read("lunar_illumination.json")),
      routes = operationsSchema.parse(read("operations_terrain.json"));
    expect(light.sites).toHaveLength(8);
    expect(light.crosschecks).toHaveLength(4);
    expect(routes.profiles).toHaveLength(18);
    const broken = structuredClone(routes);
    broken.profiles[0].sample_spacing_m = 4000;
    expect(operationsSchema.safeParse(broken).success).toBe(false);
  });
});
describe("research calculations keep observations, assumptions and unknowns distinct", () => {
  it("does not normalize incomplete mineral/composition data", () => {
    expect(compositionClosure([98.6, 1.4]).closurePass).toBe(true);
    expect(compositionClosure([50, null]).normalized).toBeNull();
    expect(compositionClosure([50, null]).closurePass).toBeNull();
    expect(() => compositionClosure([-1, 101])).toThrow();
  });
  it("checks Earth solar geometry against seasonal limits", () => {
    expect(earthSolar(0, 80, 12).elevation).toBeGreaterThan(89);
    expect(earthSolar(90, 172, 12).elevation).toBeCloseTo(23.45, 0);
    expect(earthSolar(90, 355, 12).elevation).toBeLessThan(-23);
    expect(earthSolar(0, 80, 0).cosineOnHorizontal).toBe(0);
  });
  it("resource mass balance is a scenario, not a reserve or a transferred observation", () => {
    const p = resourceRecovery(100, 5.6, 80, 2.9);
    expect(p.recoveredKg).toBeCloseTo(4.48);
    expect(p.rangeKg![0]).toBeCloseTo(2.16);
    expect(p.reserveEstimate).toBeNull();
    expect(resourceRecovery(100, 5.6, 80).rangeKg).toBeNull();
  });
  it("Shao-Lu threshold has the analytical minimum and inverse square-root density dependence", () => {
    const d = Math.sqrt(0.0003 / (2650 * 9.80665)),
      u = dustThreshold(1.2, 2650, 9.80665, d)!;
    expect(dustThreshold(1.2, 2650, 9.80665, 2 * d)).toBeGreaterThan(u);
    expect(dustThreshold(0.3, 2650, 9.80665, d)).toBeCloseTo(2 * u, 10);
    expect(dustThreshold(0, 2650, 1.62, d)).toBeNull();
    expect(() => dustThreshold(-1, 2650, 9.8, d)).toThrow();
  });
  it("does not equate10m mean wind and friction velocity", () => {
    expect(frictionVelocity10m(10, 0.001)).toBeCloseTo(
      (0.4 * 10) / Math.log(10000),
    );
    expect(() => frictionVelocity10m(10, 10)).toThrow();
  });
  it("requires blanks and positive controls before any assay threshold interpretation", () => {
    expect(assayQuality([], [], null, null).state).toBe("incomplete");
    const p = assayQuality([10, 12], [0, 1, 2], 11, 10);
    expect(p.state).toBe("assessed");
    if (p.state === "assessed") {
      expect(p.threshold).toBe(4);
      expect(p.signalAboveThreshold).toBe(true);
      expect(p.recovery).toBe(1);
    }
    const failed = assayQuality([10, 12], [0, 1, 2], 100, 10);
    if (failed.state === "assessed")
      expect(failed.signalAboveThreshold).toBeNull();
    expect(() => parseReplicates("1,unknown,3")).toThrow();
  });
  it("cave plans remain relative proposals without an invented surveyed origin", () => {
    const p = caveStations(100, 30, 0.5, 5);
    expect(p.stations.map((s) => s.distanceFromSurveyedOriginM)).toEqual([
      0, 30, 60, 90, 100,
    ]);
    expect(p.geojson).toBeNull();
    expect(p.stations.every((s) => s.absoluteCoordinates === null)).toBe(true);
  });
  it("finds the shortest measured flat-grid path", () => {
    const p = terrainRoute(
      [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      250,
      0,
      8,
      10,
      2,
    );
    expect(p.status).toBe("available");
    if (p.status === "available") {
      expect(p.lengthM).toBeCloseTo(500 * Math.SQRT2);
      expect(p.ascentM).toBe(0);
      expect(p.path).toEqual([0, 4, 8]);
    }
  });
  it("rejects invalid endpoints and diagonal corner cuts", () => {
    expect(
      terrainRoute(
        [
          [0, null],
          [null, 0],
        ],
        250,
        0,
        3,
        10,
        2,
      ).status,
    ).toBe("unavailable");
    expect(
      terrainRoute(
        [
          [0, null],
          [0, 0],
        ],
        250,
        1,
        3,
        10,
        2,
      ).status,
    ).toBe("unavailable");
  });
  it("route constraints can exclude a path without claiming a field hazard", () => {
    const p = terrainRoute(
      [
        [0, 1000],
        [0, 1000],
      ],
      250,
      0,
      3,
      10,
      2,
    );
    expect(p.status).toBe("unavailable");
    if (p.status === "unavailable") expect(p.reason).toContain("not proof");
  });
  it("exports route coordinates using physical offsets", () => {
    expect(routeCoordinates(0, 0, 1, 1, 3, 250)).toEqual([0, 0]);
    expect(routeCoordinates(0, 0, 1, 2, 3, 250)[0]).toBeCloseTo(
      ((250 / 6371000) * 180) / Math.PI,
      8,
    );
  });
  it("lunar tradeoffs change with explicit model choices and never invent resources", () => {
    const p = illuminationSchema.parse(read("lunar_illumination.json"));
    const a = baseTradeoffs(p.sites, 0, 20, 0, 8760),
      b = baseTradeoffs(p.sites, 1, 20, 0, 8760);
    expect(a.map((r) => r.id)).not.toEqual(b.map((r) => r.id));
    expect(
      a.every(
        (r) => r.resourceAbundance === null && r.engineeringAccess === null,
      ),
    ).toBe(true);
    expect(
      baseTradeoffs(p.sites, 1, 20, 0.99, 8760).every((r) => !r.eligible),
    ).toBe(true);
    expect(autonomyWh(100, 10, 0.8)).toBe(1250);
  });
});
