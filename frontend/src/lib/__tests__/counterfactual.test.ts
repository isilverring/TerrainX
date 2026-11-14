import { describe, expect, it } from "vitest";
import {
  defaultScenario,
  scoreCandidate,
  rank,
  explain,
  dominates,
  paretoFront,
  robustness,
  mulberry32,
} from "../counterfactual";
import { realDataset } from "./fixtures";

const data = realDataset();

describe("pure scoring reproduces the released pipeline", () => {
  it("default scenario reproduces stored F, U, C and P for every candidate", () => {
    for (const m of ["jezero", "mare-crisium"] as const) {
      const s = defaultScenario(m);
      for (const c of data.candidates) {
        const r = scoreCandidate(c, m, s),
          a = c.assessments[m];
        if (a.fidelity.value == null) expect(r.F).toBeNull();
        else expect(r.F!).toBeCloseTo(a.fidelity.value, 9);
        expect(r.C).toBeCloseTo(a.utility.coverage, 12);
        if (a.utility.value != null)
          expect(r.U!).toBeCloseTo(a.utility.value, 9);
        if (a.priority != null) expect(r.P!).toBeCloseTo(a.priority, 9);
        else expect(r.P).toBeNull();
      }
    }
  });
});

describe("12. ranking updates after changed weights", () => {
  it("changes order deterministically when the F/U balance changes", () => {
    const base = defaultScenario("jezero");
    const before = rank(data.candidates, "jezero", base)
      .filter((r) => r.rank != null)
      .map((r) => r.candidate.id);
    // Real data: with alpha = 0 (utility only) Gobi 01 (U 68) overtakes Western Saudi Arabia 02 (F 95, U 66).
    const next = { ...base, alpha: 0 };
    const after = rank(data.candidates, "jezero", next)
      .filter((r) => r.rank != null)
      .map((r) => r.candidate.id);
    expect(after).not.toEqual(before);
    expect(
      rank(data.candidates, "jezero", next).map((r) => r.candidate.id),
    ).toEqual(rank(data.candidates, "jezero", next).map((r) => r.candidate.id));
    // With alpha = 0 the top candidate has the highest U among eligible candidates (C = 1 for all).
    const elig = rank(data.candidates, "jezero", next).filter(
      (r) => r.rank != null,
    );
    expect(elig[0].U).toBeCloseTo(Math.max(...elig.map((r) => r.U!)), 12);
    expect(elig[0].candidate.id).toBe("gobi-42.000-101.250");
  });
  it("explains movements from exact score deltas", () => {
    const base = defaultScenario("jezero");
    const next = { ...base, alpha: 0.9 };
    for (const e of explain(data.candidates, "jezero", base, next)) {
      if (e.after.P == null || e.before.P == null) continue;
      const sum =
        e.contributions.alpha +
        e.contributions.tolerances +
        e.contributions.weights;
      expect(sum).toBeCloseTo(e.after.P - e.before.P, 9);
      if (e.driver !== "none") expect(e.driver).toBe("alpha");
      if (e.driver === "alpha")
        expect(e.sentence).toMatch(
          /terrain fidelity F was weighted more heavily/,
        );
    }
  });
  it("raising the minimum coverage removes candidates but never invents scores", () => {
    const s = { ...defaultScenario("jezero"), minCoverage: 1.01 };
    expect(
      rank(data.candidates, "jezero", s).every((r) => r.rank == null),
    ).toBe(true);
  });
});

describe("17. unknown geology never becomes verified geology", () => {
  it("never ranks a candidate whose geology is unknown, whatever the weights", () => {
    for (const geology of [0, 0.05, 0.55, 1]) {
      const s = {
        ...defaultScenario("mare-crisium"),
        weights: { geology, terrain: 1, aridity: 1, temperature: 1 },
        minCoverage: 0,
      };
      const ranked = rank(data.candidates, "mare-crisium", s);
      for (const r of ranked) {
        if (r.criteria.geology == null) {
          expect(r.rank).toBeNull();
          expect(r.reason).toMatch(/Geology unknown/);
        }
      }
    }
  });
});

describe("13. Pareto dominance", () => {
  it("implements weak dominance with one strict improvement", () => {
    expect(dominates({ F: 2, U: 2 }, { F: 1, U: 1 })).toBe(true);
    expect(dominates({ F: 2, U: 1 }, { F: 1, U: 1 })).toBe(true);
    expect(dominates({ F: 1, U: 1 }, { F: 1, U: 1 })).toBe(false);
    expect(dominates({ F: 2, U: 0 }, { F: 1, U: 1 })).toBe(false);
  });
  it("returns exactly the nondominated set", () => {
    const pts = [
      { id: "a", F: 90, U: 50 },
      { id: "b", F: 60, U: 80 },
      { id: "c", F: 55, U: 75 },
      { id: "d", F: 90, U: 40 },
      { id: "e", F: 70, U: 70 },
    ];
    expect(
      paretoFront(pts)
        .map((p) => p.id)
        .sort(),
    ).toEqual(["a", "b", "e"]);
  });
});

describe("14. seeded sensitivity analysis", () => {
  it("is reproducible for the same seed and differs for another seed", () => {
    const base = defaultScenario("jezero");
    const a = robustness(data.candidates, "jezero", base, { seed: 7 });
    const b = robustness(data.candidates, "jezero", base, { seed: 7 });
    const c = robustness(data.candidates, "jezero", base, { seed: 8 });
    expect(a).toEqual(b);
    expect(a.scenarios).toBe(200);
    expect(JSON.stringify(a.stats.map((s) => s.ranks))).not.toEqual(
      JSON.stringify(c.stats.map((s) => s.ranks)),
    );
    for (const s of a.stats) {
      expect(s.best).toBeLessThanOrEqual(s.median);
      expect(s.median).toBeLessThanOrEqual(s.worst);
      expect(s.firstShare).toBeGreaterThanOrEqual(0);
      expect(s.top3Share).toBeLessThanOrEqual(1);
      expect(s.ranks.length).toBe(200);
    }
    expect(a.stats.reduce((t, s) => t + s.firstShare, 0)).toBeCloseTo(1, 12);
  });
  it("zero perturbation reproduces the default ranking in every scenario", () => {
    const base = defaultScenario("jezero");
    const r = robustness(data.candidates, "jezero", base, {
      range: 0,
      scenarios: 20,
    });
    const order = rank(data.candidates, "jezero", base).filter(
      (x) => x.rank != null,
    );
    for (const s of r.stats)
      expect(new Set(s.ranks)).toEqual(
        new Set([order.find((o) => o.candidate.id === s.id)!.rank]),
      );
  });
  it("PRNG is deterministic and in [0,1)", () => {
    const g = mulberry32(42),
      h = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const x = g();
      expect(x).toBe(h());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
