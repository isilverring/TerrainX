import { describe, expect, it } from "vitest";
import { buildPacket, packetCsv, packetGeoJSON } from "../packet";
import { realDataset } from "./fixtures";

const data = realDataset();

describe("15. exported data matches displayed results", () => {
  it("packet scores, observations and terrain equal the dataset values shown in the UI", () => {
    for (const m of ["jezero", "mare-crisium"] as const)
      for (const c of data.candidates) {
        const p = buildPacket(data, c, m, "2026-11-14T00:00:00Z");
        const a = c.assessments[m];
        expect(p.scores.F).toBe(a.fidelity.value);
        expect(p.scores.U).toBe(a.utility.value);
        expect(p.scores.C).toBe(a.utility.coverage);
        expect(p.scores.P).toBe(a.priority);
        expect(p.candidate.latitude).toBe(c.latitude);
        expect(p.candidate.status).toBe(a.utility.status);
        expect(p.terrain.metrics).toEqual(c.terrain.metrics);
        for (const o of p.observations) {
          const src = c.climate[o.variable as "T2M"]!;
          expect(o.value).toBe(src.value);
          expect(o.unit).toBe(src.unit);
          expect(o.source_url).toBe(src.provenance.source_url);
        }
        if (c.benchmark)
          expect(p.candidate.discovery_note).toMatch(
            /never counted as a new discovery/,
          );
      }
  });
  it("CSV rows carry the same numbers as the packet", () => {
    const c = data.candidates.find((x) => x.id === "saudi-24.000-39.375")!;
    const p = buildPacket(data, c, "jezero");
    const csv = packetCsv(p);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("section,name,value,unit,classification,source");
    const row = (name: string) =>
      lines
        .find((l) => l.split(",").slice(0, 2).join(",").includes(name))!
        .split(",");
    expect(Number(row("F terrain fidelity")[2])).toBe(p.scores.F);
    expect(Number(row("U mission utility")[2])).toBe(p.scores.U);
    expect(Number(row("observation,T2M")[2])).toBe(c.climate.T2M!.value);
    expect(Number(row("relief_m")[2])).toBe(c.terrain.metrics!.relief_m);
  });
  it("unknown values export as empty, never as zero", () => {
    const c = data.candidates.find((x) => x.id === "chile--22.500--70.000")!;
    const p = buildPacket(data, c, "jezero");
    expect(p.scores.criteria.geology.value).toBeNull();
    expect(p.scores.P).toBeNull();
    const geo = packetCsv(p)
      .split("\n")
      .find((l) => l.startsWith("criterion,geology"))!;
    expect(geo.split(",")[2]).toBe("");
    expect(p.next_measurements.hypothetical_U_bounds).not.toBeNull();
  });
  it("GeoJSON point uses lon/lat of the candidate and a closed footprint polygon", () => {
    const c = data.candidates[0];
    const g = packetGeoJSON(buildPacket(data, c, "jezero"));
    expect(g.features[0].geometry.coordinates).toEqual([
      c.longitude,
      c.latitude,
    ]);
    const ring = g.features[1].geometry.coordinates[0] as number[][];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(g.features[0].properties.F).toBe(
      c.assessments.jezero.fidelity.value,
    );
  });
});

import { beyondKnown, explainScores } from "../story";
describe("Beyond the known analogs", () => {
  it("keeps statuses distinct and never promotes unknown geology", () => {
    const mars = beyondKnown(data, "jezero");
    expect(mars.bestBenchmark!.benchmark).toBe(true);
    expect(mars.bestExploratory!.benchmark).toBe(false);
    expect(mars.bestExploratory!.assessments.jezero.utility.status).toBe(
      "CHARACTERIZED CANDIDATE",
    );
    expect(mars.topScreening!.benchmark).toBe(false);
    for (const c of mars.unexpected)
      expect(c.assessments.jezero.priority!).toBeGreaterThanOrEqual(
        mars.threshold!,
      );
    const moon = beyondKnown(data, "mare-crisium");
    expect(moon.bestExploratory).toBeNull();
    expect(moon.unexpected).toEqual([]);
  });
  it("explains with actual component values", () => {
    const c = data.candidates.find((x) => x.id === "saudi-24.000-39.375")!;
    const t = explainScores(c, "jezero");
    expect(t).toContain(`F ${c.assessments.jezero.fidelity.value!.toFixed(1)}`);
    expect(t).toMatch(/s = \d\.\d\d/);
  });
});
