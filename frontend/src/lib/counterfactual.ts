/**
 * Counterfactual mission explorer, Pareto frontier and rank robustness.
 *
 * Every number is recomputed from the stored inputs (terrain feature values,
 * criterion values) with pure functions that mirror the Python pipeline:
 *   sᵢ = exp(−½((Eᵢ − Pᵢ)/τᵢ)²), F = 100·mean(sᵢ)
 *   U = 100·Σ wₖuₖ / Σ_assessed wₖ, C = Σ_assessed wₖ / Σ wₖ
 *   P = (αF + (1 − α)U)·C^γ, only when F and U exist, C ≥ C_min and geology is assessed.
 * Unknown values stay null; unknown geology is never treated as zero or as verified.
 */
import type { Candidate, Mission } from "./models";
import type { CriterionKey } from "./frontier";
import { CRITERIA, criterionNames } from "./frontier";

export type FeatureKey =
  "median_slope_deg" | "p90_slope_deg" | "relief_m" | "detrended_rms_m";
export const FEATURES: FeatureKey[] = [
  "median_slope_deg",
  "p90_slope_deg",
  "relief_m",
  "detrended_rms_m",
];
export const DEFAULT_TOLERANCES: Record<FeatureKey, number> = {
  median_slope_deg: 3,
  p90_slope_deg: 5,
  relief_m: 150,
  detrended_rms_m: 75,
};
export const DEFAULT_ALPHA: Record<Mission, number> = {
  jezero: 0.3,
  "mare-crisium": 0.55,
};
export const DEFAULT_WEIGHTS: Record<Mission, Record<CriterionKey, number>> = {
  jezero: { geology: 0.55, terrain: 0.2, aridity: 0.15, temperature: 0.1 },
  "mare-crisium": {
    geology: 0.55,
    terrain: 0.3,
    aridity: 0.1,
    temperature: 0.05,
  },
};
export interface Scenario {
  alpha: number;
  weights: Record<CriterionKey, number>;
  tolerances: Record<FeatureKey, number>;
  minCoverage: number;
  gamma: number;
}
export function defaultScenario(mission: Mission): Scenario {
  return {
    alpha: DEFAULT_ALPHA[mission],
    weights: { ...DEFAULT_WEIGHTS[mission] },
    tolerances: { ...DEFAULT_TOLERANCES },
    minCoverage: 0.7,
    gamma: 1,
  };
}

export interface Scored {
  candidate: Candidate;
  F: number | null;
  U: number | null;
  C: number;
  P: number | null;
  geologyAssessed: boolean;
  eligible: boolean;
  reason: string | null;
  criteria: Record<CriterionKey, number | null>;
}

export function fidelityWith(
  c: Candidate,
  mission: Mission,
  tolerances: Record<FeatureKey, number>,
) {
  const comps = c.assessments[mission].fidelity.components;
  if (
    c.assessments[mission].fidelity.value == null ||
    comps.length !== FEATURES.length
  )
    return null;
  let sum = 0;
  for (const comp of comps) {
    const tau = tolerances[comp.feature as FeatureKey];
    if (!(tau > 0)) throw new Error("Tolerances must be positive");
    sum += Math.exp(-0.5 * ((comp.earth - comp.planet) / tau) ** 2);
  }
  return (100 * sum) / comps.length;
}

export function scoreCandidate(
  c: Candidate,
  mission: Mission,
  s: Scenario,
): Scored {
  const a = c.assessments[mission];
  const criteria = Object.fromEntries(
    CRITERIA.map((k) => [k, a.utility.criteria[k]?.value ?? null]),
  ) as Record<CriterionKey, number | null>;
  const total = CRITERIA.reduce((t, k) => t + s.weights[k], 0);
  if (!(total > 0)) throw new Error("Weights must have a positive sum");
  let assessed = 0,
    weighted = 0;
  for (const k of CRITERIA) {
    const v = criteria[k];
    if (v != null) {
      assessed += s.weights[k];
      weighted += s.weights[k] * v;
    }
  }
  const U = assessed > 0 ? (100 * weighted) / assessed : null;
  const C = assessed / total;
  const F = fidelityWith(c, mission, s.tolerances);
  const geologyAssessed = criteria.geology != null;
  let reason: string | null = null;
  if (F == null) reason = "Terrain fidelity not assessed";
  else if (U == null) reason = "No assessed utility criteria";
  else if (!geologyAssessed)
    reason = "Geology unknown — not rankable as a geological analog";
  else if (C < s.minCoverage - 1e-12)
    reason = `Coverage ${(100 * C).toFixed(0)}% below ${(100 * s.minCoverage).toFixed(0)}%`;
  const eligible = reason == null;
  const P = eligible
    ? (s.alpha * F! + (1 - s.alpha) * U!) * C ** s.gamma
    : null;
  return {
    candidate: c,
    F,
    U,
    C,
    P,
    geologyAssessed,
    eligible,
    reason,
    criteria,
  };
}

export interface Ranked extends Scored {
  rank: number | null;
}
/** Ranks algorithmic candidates by P; ineligible candidates are listed with their reason, never ranked. */
export function rank(
  candidates: Candidate[],
  mission: Mission,
  s: Scenario,
): Ranked[] {
  const scored = candidates
    .filter((c) => !c.benchmark)
    .map((c) => scoreCandidate(c, mission, s));
  const eligible = scored
    .filter((x) => x.eligible)
    .sort(
      (a, b) => b.P! - a.P! || a.candidate.id.localeCompare(b.candidate.id),
    );
  const out: Ranked[] = eligible.map((x, i) => ({ ...x, rank: i + 1 }));
  return [
    ...out,
    ...scored
      .filter((x) => !x.eligible)
      .sort((a, b) => a.candidate.id.localeCompare(b.candidate.id))
      .map((x) => ({ ...x, rank: null })),
  ];
}

export interface Explained {
  id: string;
  before: Ranked;
  after: Ranked;
  rankDelta: number | null;
  pDelta: number | null;
  contributions: { alpha: number; tolerances: number; weights: number };
  driver: "alpha" | "tolerances" | "weights" | "none";
  sentence: string;
}
/** Sequential, exact decomposition of ΔP into α, tolerance and weight changes (in that order). */
export function explain(
  candidates: Candidate[],
  mission: Mission,
  base: Scenario,
  next: Scenario,
): Explained[] {
  const before = rank(candidates, mission, base),
    after = rank(candidates, mission, next);
  const stepA: Scenario = {
      ...base,
      alpha: next.alpha,
      minCoverage: next.minCoverage,
    },
    stepT: Scenario = { ...stepA, tolerances: next.tolerances };
  return after.map((a) => {
    const b = before.find((x) => x.candidate.id === a.candidate.id)!;
    const c = a.candidate;
    const p0 = scoreCandidate(c, mission, { ...base, minCoverage: 0 }).P,
      p1 = scoreCandidate(c, mission, { ...stepA, minCoverage: 0 }).P,
      p2 = scoreCandidate(c, mission, { ...stepT, minCoverage: 0 }).P,
      p3 = scoreCandidate(c, mission, { ...next, minCoverage: 0 }).P;
    const contributions =
      p0 != null && p1 != null && p2 != null && p3 != null
        ? { alpha: p1 - p0, tolerances: p2 - p1, weights: p3 - p2 }
        : { alpha: 0, tolerances: 0, weights: 0 };
    const entries = Object.entries(contributions) as [
      "alpha" | "tolerances" | "weights",
      number,
    ][];
    const [driver, size] = entries.reduce(
      (m, e) => (Math.abs(e[1]) > Math.abs(m[1]) ? e : m),
      ["none", 0] as ["alpha" | "tolerances" | "weights" | "none", number],
    );
    const rankDelta = a.rank != null && b.rank != null ? b.rank - a.rank : null;
    const pDelta = a.P != null && b.P != null ? a.P - b.P : null;
    let sentence: string;
    if (!a.eligible) sentence = `Not ranked: ${a.reason}.`;
    else if (!b.eligible)
      sentence = `Newly rankable under the changed model: coverage ${(100 * b.C).toFixed(0)}% → ${(100 * a.C).toFixed(0)}%, required ${(100 * base.minCoverage).toFixed(0)}% → ${(100 * next.minCoverage).toFixed(0)}%; geological evidence remains required.`;
    else if (Math.abs(size) < 0.05)
      sentence =
        "Essentially unchanged by these settings; any rank change comes from other candidates moving.";
    else {
      const dir = size > 0 ? "upward" : "downward";
      const move = `Its own P changed by ${pDelta! >= 0 ? "+" : ""}${pDelta!.toFixed(1)}; the largest model contribution was ${dir}`;
      if (driver === "alpha") {
        const fMore = next.alpha > base.alpha;
        sentence = `${move} because terrain fidelity F was weighted ${fMore ? "more" : "less"} heavily relative to utility U (F ${a.F!.toFixed(0)} vs U ${a.U!.toFixed(0)}).`;
      } else if (driver === "tolerances")
        sentence = `${move} mainly because the similarity tolerances changed its terrain fidelity (F ${b.F!.toFixed(1)} → ${a.F!.toFixed(1)}).`;
      else {
        const mean = (a.U ?? 0) / 100;
        const k = CRITERIA.filter((x) => a.criteria[x] != null).reduce(
          (best, x) =>
            Math.abs(
              (next.weights[x] - base.weights[x]) *
                ((a.criteria[x] ?? 0) - mean),
            ) >
            Math.abs(
              (next.weights[best] - base.weights[best]) *
                ((a.criteria[best] ?? 0) - mean),
            )
              ? x
              : best,
        );
        const heavier = next.weights[k] > base.weights[k];
        sentence = `${move} mainly because ${criterionNames[k].toLowerCase()} was weighted ${heavier ? "more" : "less"} heavily and scores ${(a.criteria[k] ?? 0).toFixed(2)} here.`;
      }
      sentence +=
        rankDelta === 0
          ? " Its rank is unchanged."
          : ` Rank ${b.rank} → ${a.rank} depends on all candidates; ${rankDelta! > 0 ? "it overtook peers" : "peers overtook it"}, not solely on its own score change.`;
    }
    return {
      id: c.id,
      before: b,
      after: a,
      rankDelta,
      pDelta,
      contributions,
      driver: Math.abs(size) < 0.05 ? "none" : driver,
      sentence,
    };
  });
}

export interface ParetoPoint {
  id: string;
  F: number;
  U: number;
}
/** A dominates B when A is ≥ B in both objectives and > in at least one. */
export function dominates(
  a: { F: number; U: number },
  b: { F: number; U: number },
) {
  return a.F >= b.F && a.U >= b.U && (a.F > b.F || a.U > b.U);
}
export function paretoFront<T extends { F: number; U: number }>(
  points: T[],
): T[] {
  return points.filter((p) => !points.some((q) => q !== p && dominates(q, p)));
}

/** Deterministic PRNG (mulberry32). */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Stability {
  id: string;
  name: string;
  median: number;
  best: number;
  worst: number;
  q25: number;
  q75: number;
  firstShare: number;
  top3Share: number;
  ranks: number[];
  eligibleScenarios: number;
  eligibleShare: number;
}
/**
 * Ranking stability under model assumptions: N scenarios with weights and tolerances
 * perturbed multiplicatively by up to ±range (uniform), weights renormalized.
 * This is weight/tolerance sensitivity only — not statistical confidence, not evidence
 * completeness, not measurement uncertainty, and not a probability of mission success.
 */
export function robustness(
  candidates: Candidate[],
  mission: Mission,
  base: Scenario,
  opts: { scenarios?: number; range?: number; seed?: number } = {},
): { stats: Stability[]; scenarios: number; seed: number; range: number } {
  const n = opts.scenarios ?? 200,
    range = opts.range ?? 0.25,
    seed = opts.seed ?? 20261003;
  const rnd = mulberry32(seed);
  const ranks = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const w = Object.fromEntries(
      CRITERIA.map((k) => [k, base.weights[k] * (1 + range * (2 * rnd() - 1))]),
    ) as Record<CriterionKey, number>;
    const total = CRITERIA.reduce((t, k) => t + w[k], 0);
    CRITERIA.forEach((k) => (w[k] /= total));
    const tol = Object.fromEntries(
      FEATURES.map((f) => [
        f,
        base.tolerances[f] * (1 + range * (2 * rnd() - 1)),
      ]),
    ) as Record<FeatureKey, number>;
    for (const r of rank(candidates, mission, {
      ...base,
      weights: w,
      tolerances: tol,
    })) {
      if (r.rank == null) continue;
      const list = ranks.get(r.candidate.id) ?? [];
      list.push(r.rank);
      ranks.set(r.candidate.id, list);
    }
  }
  const q = (s: number[], p: number) => {
    const pos = (s.length - 1) * p,
      lo = Math.floor(pos),
      hi = Math.min(lo + 1, s.length - 1);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  };
  const stats: Stability[] = [...ranks.entries()].map(([id, list]) => {
    const s = [...list].sort((a, b) => a - b);
    return {
      id,
      name: candidates.find((c) => c.id === id)!.name,
      median: q(s, 0.5),
      best: s[0],
      worst: s[s.length - 1],
      q25: q(s, 0.25),
      q75: q(s, 0.75),
      firstShare: s.filter((r) => r === 1).length / n,
      top3Share: s.filter((r) => r <= 3).length / n,
      ranks: list,
      eligibleScenarios: list.length,
      eligibleShare: list.length / n,
    };
  });
  stats.sort(
    (a, b) =>
      a.median - b.median || a.best - b.best || a.id.localeCompare(b.id),
  );
  return { stats, scenarios: n, seed, range };
}
