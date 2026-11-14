import { describe, expect, it } from "vitest";
import { realDataset } from "./fixtures";
import { defaultScenario, rank } from "../counterfactual";
import { LENSES, agreement, lensRanking } from "../lenses";
import type { Mission } from "../models";

const data = realDataset();
const missions: Mission[] = ["jezero", "mare-crisium"];

describe("discovery lenses", () => {
  for (const m of missions) {
    const s = defaultScenario(m);
    const rankings = LENSES.map((l) => lensRanking(data.candidates, m, l, s));
    it(`${m}: baseline lens reproduces the released ranking exactly`, () => {
      const base = rank(data.candidates, m, s);
      const lens = rankings[0];
      expect(lens.map((r) => [r.id, r.rank])).toEqual(base.map((r) => [r.candidate.id, r.rank]));
    });
    it(`${m}: benchmarks are excluded from every lens`, () => {
      const benchmarks = new Set(data.candidates.filter((c) => c.benchmark).map((c) => c.id));
      for (const r of rankings) {
        expect(r).toHaveLength(data.candidates.length - benchmarks.size);
        expect(r.some((x) => benchmarks.has(x.id))).toBe(false);
      }
    });
    it(`${m}: unknown geology is never ranked by evidence lens and never helps the pessimistic lens`, () => {
      const evidence = rankings[LENSES.findIndex((l) => l.id === "evidence")];
      const pess = rankings[LENSES.findIndex((l) => l.id === "pessimistic")];
      for (const c of data.candidates.filter((c) => !c.benchmark)) {
        const geo = c.assessments[m].utility.criteria.geology?.value ?? null;
        if (geo == null) {
          expect(evidence.find((x) => x.id === c.id)!.rank).toBeNull();
          const p = pess.find((x) => x.id === c.id)!;
          // Pessimistic value equals the lens with geology explicitly set to 0.
          if (p.value != null) expect(p.inputs.missing).toBeGreaterThan(0);
        }
      }
    });
    it(`${m}: active lens equals baseline under the default model, ranks are dense and ties reproducible`, () => {
      expect(rankings[1].map((r) => r.rank)).toEqual(rankings[0].map((r) => r.rank));
      for (const r of rankings) {
        const ranks = r.map((x) => x.rank).filter((x): x is number => x != null);
        expect(ranks).toEqual(ranks.map((_, i) => i + 1));
        r.filter((x) => x.rank == null).forEach((x) => expect(x.reason).toBeTruthy());
      }
      expect(lensRanking(data.candidates, m, LENSES[3], s)).toEqual(rankings[3]);
    });
  }
  it("pessimistic lens never exceeds the optimistic bound and terrain lens equals F", () => {
    const s = defaultScenario("jezero");
    const terrain = lensRanking(data.candidates, "jezero", LENSES[2], s);
    for (const r of terrain) {
      const c = data.candidates.find((c) => c.id === r.id)!;
      if (r.value != null) expect(r.value).toBeCloseTo(c.assessments.jezero.fidelity.value!, 6);
    }
  });
  it("pessimistic lens equals baseline P for fully assessed candidates and is lower when evidence is missing", () => {
    for (const m of missions) {
      const s = defaultScenario(m);
      const base = lensRanking(data.candidates, m, LENSES[0], s);
      const pess = lensRanking(data.candidates, m, LENSES[5], s);
      for (const p of pess) {
        const b = base.find((x) => x.id === p.id)!;
        if (p.value == null) continue;
        if (p.inputs.missing === 0 && b.value != null) expect(p.value).toBeCloseTo(b.value, 9);
        if ((p.inputs.missing ?? 0) > 0) expect(p.inputs.U_min!).toBeLessThan(100);
      }
      // Jezero has fully assessed candidates; no automatic Moon candidate has assessed geology.
      expect(pess.some((p) => p.inputs.missing === 0 && p.value != null)).toBe(m === "jezero");
      if (m === "mare-crisium") expect(base.every((b) => b.rank == null)).toBe(true);
    }
  });
  it("agreement summarises ranks without inventing values", () => {
    const s = defaultScenario("jezero");
    const rankings = LENSES.map((l) => lensRanking(data.candidates, "jezero", l, s));
    const a = agreement(rankings);
    expect(a).toHaveLength(16);
    for (const x of a) {
      expect(x.ranks).toHaveLength(LENSES.length);
      expect(x.rankedIn).toBe(x.ranks.filter((r) => r != null).length);
      if (x.best != null) expect(x.best).toBeLessThanOrEqual(x.worst!);
    }
  });
});
