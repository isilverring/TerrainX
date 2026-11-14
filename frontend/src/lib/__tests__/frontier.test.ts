import { describe, expect, it } from "vitest";
import {
  utilityBounds,
  priorityBounds,
  frontier,
  measurementPriority,
  rankAmong,
  nextMeasurements,
} from "../frontier";
import { realDataset } from "./fixtures";

const w = { geology: 0.55, terrain: 0.2, aridity: 0.15, temperature: 0.1 };

describe("score bounds under missing criteria (test 11)", () => {
  it("evaluates a missing criterion at s=0 and s=1 while preserving known inputs", () => {
    const b = utilityBounds(
      {
        geology: { value: null },
        terrain: { value: 1 },
        aridity: { value: 1 },
        temperature: { value: 1 },
      },
      w,
    );
    expect(b.min).toBeCloseTo(45, 10); // 100*(0.2+0.15+0.1)/1
    expect(b.max).toBeCloseTo(100, 10);
    expect(b.partial).toBeCloseTo(100, 10); // renormalized over known weight only
    expect(b.coverage).toBeCloseTo(0.45, 10);
    expect(b.missing).toEqual(["geology"]);
  });
  it("collapses to a point when nothing is missing", () => {
    const b = utilityBounds(
      {
        geology: { value: 0.5 },
        terrain: { value: 0.8 },
        aridity: { value: 0.9 },
        temperature: { value: 0.6 },
      },
      w,
    );
    expect(b.min).toBeCloseTo(b.max, 12);
    expect(b.min).toBeCloseTo(
      100 * (0.55 * 0.5 + 0.2 * 0.8 + 0.15 * 0.9 + 0.1 * 0.6),
      10,
    );
  });
  it("handles several missing criteria as a worst/best case", () => {
    const b = utilityBounds(
      {
        geology: { value: null },
        terrain: { value: null },
        aridity: { value: 0.5 },
        temperature: { value: 1 },
      },
      w,
    );
    expect(b.min).toBeCloseTo(100 * (0.075 + 0.1), 10);
    expect(b.max).toBeCloseTo(100 * (0.075 + 0.1 + 0.55 + 0.2), 10);
  });
  it("partial U always lies inside the interval", () => {
    const data = realDataset();
    for (const c of data.candidates)
      for (const m of ["jezero", "mare-crisium"] as const) {
        const a = c.assessments[m];
        const b = utilityBounds(
          a.utility.criteria,
          a.utility.weights as typeof w,
        );
        if (b.partial != null) {
          expect(b.partial).toBeGreaterThanOrEqual(b.min - 1e-9);
          expect(b.partial).toBeLessThanOrEqual(b.max + 1e-9);
          expect(b.partial).toBeCloseTo(a.utility.value!, 9);
        }
      }
  });
  it("rejects out-of-range criteria", () => {
    expect(() => utilityBounds({ geology: { value: 1.2 } }, w)).toThrow();
  });
  it("priority interval assumes full coverage after measurement and needs F", () => {
    const b = utilityBounds(
      {
        geology: { value: null },
        terrain: { value: 1 },
        aridity: { value: 1 },
        temperature: { value: 1 },
      },
      w,
    );
    expect(priorityBounds(null, b, 0.3)).toBeNull();
    const p = priorityBounds(80, b, 0.3)!;
    expect(p.min).toBeCloseTo(0.3 * 80 + 0.7 * 45, 10);
    expect(p.max).toBeCloseTo(0.3 * 80 + 0.7 * 100, 10);
  });
});

describe("measurement priority and frontier on the real dataset", () => {
  it("ranks ties against the candidate", () => {
    expect(rankAmong(50, [60, 50, 40])).toBe(3);
    expect(rankAmong(99, [60, 50])).toBe(1);
  });
  it("uses declared rules", () => {
    expect(measurementPriority(true, true, 0)).toBe("High");
    expect(measurementPriority(true, false, 4)).toBe("High");
    expect(measurementPriority(true, false, 0)).toBe("Medium");
    expect(measurementPriority(false, false, 1)).toBe("Low");
  });
  it("lists only algorithmic candidates with missing evidence, never benchmarks", () => {
    const data = realDataset();
    for (const m of ["jezero", "mare-crisium"] as const) {
      const rows = frontier(data.candidates, m);
      expect(rows.every((r) => !r.candidate.benchmark)).toBe(true);
      expect(rows.every((r) => r.bounds.missing.length > 0)).toBe(true);
      expect(rows.length).toBe(
        data.candidates.filter(
          (c) =>
            !c.benchmark &&
            Object.values(c.assessments[m].utility.criteria).some(
              (x) => x.value == null,
            ),
        ).length,
      );
    }
    expect(frontier(data.candidates, "jezero").length).toBe(6);
    expect(frontier(data.candidates, "mare-crisium").length).toBe(16);
  });
  it("unknown geology never becomes verified geology (test 17)", () => {
    const data = realDataset();
    const rows = frontier(data.candidates, "mare-crisium");
    for (const r of rows) {
      const a = r.candidate.assessments["mare-crisium"];
      expect(a.utility.criteria.geology.value).toBeNull();
      expect(a.utility.status).toBe("SCREENED CANDIDATE");
      expect(a.priority).toBeNull();
      expect(nextMeasurements(r.candidate, "mare-crisium")[0].inModel).toBe(
        true,
      );
    }
  });
});
