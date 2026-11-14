import { describe, expect, it } from "vitest";
import { realDataset } from "./fixtures";
import { evidenceFacts, periodText } from "../evidence";
const data = realDataset();
describe("evidence traceability and scope", () => {
  it("preserves source observations, units, hash and actual period", () => {
    const c = data.candidates[0],
      facts = evidenceFacts(c, "jezero"),
      temperature = facts.find((f) => f.id === "T2M")!;
    expect(temperature.value).toBe(c.climate.T2M!.value);
    expect(temperature.unit).toBe(c.climate.T2M!.unit);
    expect(temperature.hash).toHaveLength(64);
    expect(temperature.sources[0]).toBe(c.climate.T2M!.provenance.source_url);
    expect(temperature.period).toContain("2001-01-01");
  });
  it("keeps missing geological relevance distinct from mapped lithology", () => {
    const c = data.candidates.find((c) => c.id === "chile--22.500--70.000")!,
      fact = evidenceFacts(c, "jezero").find((f) => f.id === "geology")!;
    expect(c.geology.units.length).toBeGreaterThan(0);
    expect(fact.value).toBeNull();
    expect(fact.limitations.join(" ")).toContain(
      "coexist with known mapped lithology",
    );
  });
  it("never annualizes unsupported precipitation units in the inspector", () => {
    const c = structuredClone(data.candidates[0]);
    c.climate.PRECTOTCORR!.unit = "unsupported";
    expect(
      evidenceFacts(c, "jezero").find((f) => f.id === "annual_precip")!.value,
    ).toBeNull();
    expect(periodText(undefined)).toBe("Not recorded");
  });
});
