import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { realDataset } from "./fixtures";
import { defaultScenario } from "../counterfactual";
import { releaseSchema } from "../release";
import { makeSnapshot } from "../snapshots";
import {
  bearingDeg,
  elevationAt,
  fieldStudySchema,
  halfExtent,
  haversineM,
  legs,
  naismithHours,
  newFieldStudy,
  reliefTransect,
  terrainGrid,
  toGpx,
  toLatLon,
  toLocal,
  traverseProfile,
  traverseTotals,
} from "../fieldStudy";

const manifest = releaseSchema.parse(
  JSON.parse(readFileSync(resolve(__dirname, "../../../public/data/release.json"), "utf8")),
);
const data = { ...realDataset(), release: manifest };
const scenarios = { jezero: defaultScenario("jezero"), "mare-crisium": defaultScenario("mare-crisium") };
const withGrid = data.candidates.filter((c) => terrainGrid(c));

describe("field study geometry on the real cached SRTM grids", () => {
  it("reproduces the exact grid coordinates requested from OpenTopoData", () => {
    for (const c of withGrid) {
      const g = terrainGrid(c)!,
        url = c.terrain.provenance![0].source_url,
        locs = decodeURIComponent(new URL(url).searchParams.get("locations")!).split("|");
      // First requested location is the south-west node (row 0, col 0).
      const [lat, lon] = locs[0].split(",").map(Number);
      const p = toLatLon(g, -halfExtent(g), -halfExtent(g));
      expect(p.lat).toBeCloseTo(lat, 6);
      expect(p.lon).toBeCloseTo(lon, 6);
    }
  });
  it("returns the real sample value at every node and null outside the footprint", () => {
    const c = withGrid[0],
      g = terrainGrid(c)!,
      h = halfExtent(g);
    g.z.forEach((row, r) =>
      row.forEach((v, col) => {
        const z = elevationAt(g, col * g.spacingM - h, r * g.spacingM - h);
        if (v == null) expect(z).toBeNull();
        else expect(z).toBeCloseTo(v, 9);
      }),
    );
    expect(elevationAt(g, h + 10, 0)).toBeNull();
    expect(elevationAt(g, h + 0.5, 0)).not.toBeNull();
  });
  it("round-trips local metres and lat/lon", () => {
    const g = terrainGrid(withGrid[1])!,
      p = toLocal(g, toLatLon(g, 5321, -8765));
    expect(p.x).toBeCloseTo(5321, 6);
    expect(p.y).toBeCloseTo(-8765, 6);
  });
  it("measures great-circle distances and bearings on the 6371 km sphere", () => {
    // One degree of latitude on R = 6371 km.
    expect(haversineM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(111194.93, 1);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 9);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: -1, lon: 0 })).toBeCloseTo(180, 9);
  });
});

describe("relief transect, traverse and exports", () => {
  const c = withGrid[0],
    g = terrainGrid(c)!,
    stations = reliefTransect(g);
  it("starts on the lowest and ends on the highest real sample node", () => {
    const values = g.z.flat().filter((v): v is number => v != null);
    const first = toLocal(g, stations[0]),
      last = toLocal(g, stations.at(-1)!);
    expect(elevationAt(g, first.x, first.y)).toBeCloseTo(Math.min(...values), 3);
    expect(elevationAt(g, last.x, last.y)).toBeCloseTo(Math.max(...values), 3);
    expect(stations).toHaveLength(5);
  });
  it("profile distance equals the sum of leg distances and totals are consistent", () => {
    const profile = traverseProfile(g, stations, 200),
      t = traverseTotals(profile),
      sum = legs(g, stations).reduce((s, l) => s + l.distanceM, 0);
    expect(t.distanceM).toBeCloseTo(sum, 6);
    expect(t.ascentM - t.descentM).toBeCloseTo(profile.at(-1)!.z! - profile[0].z!, 6);
    expect(naismithHours(10000, 600)).toBeCloseTo(3, 9);
  });
  it("pins the study to the science release and validates on round trip", () => {
    const snapshot = makeSnapshot(data, scenarios, "jezero", c.id, "Test study");
    const study = { ...newFieldStudy(snapshot, c, "jezero", "Test study"), stations };
    const parsed = fieldStudySchema.parse(JSON.parse(JSON.stringify(study)));
    expect(parsed.snapshot.science.release_id).toBe(manifest.release_id);
    expect(parsed.hypothesis).toBe(c.assessments.jezero.experiment.hypothesis);
    expect(parsed.measurements.map((m) => m.text)).toEqual(c.assessments.jezero.experiment.measurements);
  });
  it("writes escaped GPX 1.1 with one waypoint per station and a route", () => {
    const snapshot = makeSnapshot(data, scenarios, "jezero", c.id, "A & <B>");
    const study = { ...newFieldStudy(snapshot, c, "jezero", "A & <B>"), stations };
    const gpx = toGpx(study, c, g);
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx.match(/<wpt /g)).toHaveLength(5);
    expect(gpx.match(/<rtept /g)).toHaveLength(5);
    expect(gpx).toContain("A &amp; &lt;B&gt;");
    expect(gpx).not.toContain("<B>");
  });
});
