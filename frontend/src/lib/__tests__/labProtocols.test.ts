import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { realDataset } from "./fixtures";
import { defaultScenario } from "../counterfactual";
import { releaseSchema } from "../release";
import { makeSnapshot } from "../snapshots";
import { LAB_MODULES } from "../researchLab";
import { LAB_PROTOCOLS, applyLabProtocol, isLabModule } from "../labProtocols";
import { decodeShare, encodeShare, fieldStudySchema, newFieldStudy, terrainGrid } from "../fieldStudy";

const manifest = releaseSchema.parse(
  JSON.parse(readFileSync(resolve(__dirname, "../../../public/data/release.json"), "utf8")),
);
const data = { ...realDataset(), release: manifest };
const scenarios = { jezero: defaultScenario("jezero"), "mare-crisium": defaultScenario("mare-crisium") };
const c = data.candidates.find((x) => terrainGrid(x))!;
const base = () =>
  newFieldStudy(makeSnapshot(data, scenarios, "jezero", c.id, "Lab test"), c, "jezero", "Lab test");

describe("Research Lab field-protocol templates", () => {
  it("has one template per Research Lab module", () => {
    expect(Object.keys(LAB_PROTOCOLS).sort()).toEqual(LAB_MODULES.map((m) => m.id).sort());
    expect(isLabModule("dust")).toBe(true);
    expect(isLabModule("nonsense")).toBe(false);
    expect(isLabModule(null)).toBe(false);
  });
  it("produces a schema-valid study for every module without touching the release snapshot", () => {
    for (const m of LAB_MODULES) {
      const before = base(),
        after = applyLabProtocol(before, m.id, c.name);
      expect(fieldStudySchema.safeParse(after).success).toBe(true);
      expect(after.lab_module).toBe(m.id);
      expect(after.snapshot).toEqual(before.snapshot);
      expect(after.candidate_id).toBe(before.candidate_id);
      expect(after.hypothesis).toContain(c.name);
      expect(after.measurements.length).toBeGreaterThan(0);
      expect(new Set(after.equipment.map((e) => e.text)).size).toBe(after.equipment.length);
    }
  });
  it("carries the lab module through full and compact share links", () => {
    const s = applyLabProtocol(base(), "caves", c.name);
    expect(decodeShare(encodeShare(s)).l).toBe("caves");
    expect(decodeShare(encodeShare(s, true)).l).toBe("caves");
    expect(decodeShare(encodeShare(base())).l).toBeUndefined();
  });
});
