/**
 * Discovery Lenses (terrainx-lenses-v1).
 *
 * A lens is a declared, deterministic way of ranking the automatic candidates for one
 * mission question. Lenses never change the released model, the cached evidence or the
 * baseline ranking; they are read-only views computed from the same release. Rules:
 *  - reference analogs (benchmarks) are excluded from every lens ranking;
 *  - a candidate a lens cannot score is listed "not ranked" with its reason, never as 0;
 *  - missing geology is never rewarded: lenses that use geology require it, the
 *    pessimistic lens counts every missing criterion at 0;
 *  - ties break by candidate id, so rankings are reproducible.
 * Fixed lenses use release-default tolerances, weights and α; only "Your model" follows
 * the active What-if scenario.
 */
import type { Candidate, Mission } from "./models";
import {
  defaultScenario,
  fidelityWith,
  scoreCandidate,
  type Scenario,
} from "./counterfactual";
import { CRITERIA, utilityBounds, type CriterionKey } from "./frontier";

export const LENS_VERSION = "terrainx-lenses-v1";

export type LensId =
  | "baseline"
  | "active"
  | "terrain"
  | "evidence"
  | "operations"
  | "pessimistic";

export type LensScore = {
  value: number | null;
  reason: string | null;
  inputs: Record<string, number | null>;
};
export type Lens = {
  id: LensId;
  name: string;
  short: string;
  question: string;
  equation: string;
  caveat: string;
  score: (c: Candidate, mission: Mission, active: Scenario) => LensScore;
};

const criteriaOf = (c: Candidate, mission: Mission) =>
  Object.fromEntries(
    CRITERIA.map((k) => [k, c.assessments[mission].utility.criteria[k]?.value ?? null]),
  ) as Record<CriterionKey, number | null>;

const priorityLens = (s: Scenario, c: Candidate, mission: Mission): LensScore => {
  const r = scoreCandidate(c, mission, s);
  return { value: r.P, reason: r.reason, inputs: { F: r.F, U: r.U, C: r.C } };
};

export const LENSES: Lens[] = [
  {
    id: "baseline",
    name: "Release baseline",
    short: "Baseline",
    question: "How does the released model rank candidates?",
    equation: "P = (αF + (1−α)U)·C^γ with release defaults; geology must be assessed and C ≥ 0.7",
    caveat: "The unchanged reference ranking every other lens is compared with.",
    score: (c, m) => priorityLens(defaultScenario(m), c, m),
  },
  {
    id: "active",
    name: "Your model",
    short: "Your model",
    question: "How does my current What-if model rank them?",
    equation: "Same P, using your active α, weights, tolerances and minimum coverage",
    caveat: "Matches the baseline until you change the model in What if.",
    score: (c, m, s) => priorityLens(s, c, m),
  },
  {
    id: "terrain",
    name: "Terrain twin",
    short: "Terrain",
    question: "Which landscapes most resemble the target's measured relief?",
    equation: "F only — Gaussian similarity of slope, relief and roughness (release tolerances)",
    caveat: "Shape only. A terrain twin is not a geological or process analog.",
    score: (c, m) => {
      const F = fidelityWith(c, m, defaultScenario(m).tolerances);
      return {
        value: F,
        reason: F == null ? "Terrain fidelity not assessed" : null,
        inputs: { F },
      };
    },
  },
  {
    id: "evidence",
    name: "Evidence-weighted utility",
    short: "Evidence",
    question: "Where is the field case best supported by assessed evidence?",
    equation: "U × C with release weights; geology must be assessed",
    caveat: "Rewards breadth of assessed evidence; ignores terrain resemblance.",
    score: (c, m) => {
      const r = scoreCandidate(c, m, defaultScenario(m));
      const reason = !r.geologyAssessed
        ? "Geology unknown — never counted as positive"
        : r.U == null
          ? "No assessed utility criteria"
          : null;
      return {
        value: reason ? null : r.U! * r.C,
        reason,
        inputs: { U: r.U, C: r.C },
      };
    },
  },
  {
    id: "operations",
    name: "Operations rehearsal",
    short: "Operations",
    question: "Where could crews rehearse traverses in dry, workable terrain?",
    equation: "100 × (0.6 · terrain suitability + 0.4 · dry-environment score)",
    caveat:
      "Terrain suitability is the mission-specific slope preference; coarse screening cannot certify traversability or safety.",
    score: (c, m) => {
      const k = criteriaOf(c, m);
      const reason =
        k.terrain == null
          ? "Terrain suitability not assessed"
          : k.aridity == null
            ? "Dry-environment score not assessed"
            : null;
      return {
        value: reason ? null : 100 * (0.6 * k.terrain! + 0.4 * k.aridity!),
        reason,
        inputs: { terrain: k.terrain, aridity: k.aridity },
      };
    },
  },
  {
    id: "pessimistic",
    name: "Pessimistic evidence",
    short: "Pessimistic",
    question: "What if every unmeasured criterion turned out unfavorable?",
    equation: "αF + (1−α)·U_min, where U_min sets each missing criterion to 0 (Frontier lower bound)",
    caveat: "A stress test, not a prediction. Candidates with gaps fall rather than being excluded.",
    score: (c, m) => {
      const s = defaultScenario(m),
        F = fidelityWith(c, m, s.tolerances),
        b = utilityBounds(c.assessments[m].utility.criteria, s.weights);
      return {
        value: F == null ? null : s.alpha * F + (1 - s.alpha) * b.min,
        reason: F == null ? "Terrain fidelity not assessed" : null,
        inputs: { F, U_min: b.min, missing: b.missing.length },
      };
    },
  },
];

export type LensRow = LensScore & { id: string; rank: number | null };

/** Ranks the automatic (non-benchmark) candidates under one lens. */
export function lensRanking(
  candidates: Candidate[],
  mission: Mission,
  lens: Lens,
  active: Scenario,
): LensRow[] {
  const rows = candidates
    .filter((c) => !c.benchmark)
    .map((c) => ({ id: c.id, ...lens.score(c, mission, active) }));
  const ranked = rows
    .filter((r) => r.value != null)
    .sort((a, b) => b.value! - a.value! || a.id.localeCompare(b.id))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const unranked = rows
    .filter((r) => r.value == null)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => ({ ...r, rank: null }));
  return [...ranked, ...unranked];
}

export type Agreement = {
  id: string;
  ranks: (number | null)[];
  rankedIn: number;
  meanRank: number | null;
  best: number | null;
  worst: number | null;
  /** Lenses where the candidate is in the top `top`. */
  topCount: number;
};

/** Agreement across lenses: rank statistics only — not a probability or a winner. */
export function agreement(
  rankings: LensRow[][],
  top = 5,
): Agreement[] {
  const ids = [...new Set(rankings.flatMap((r) => r.map((x) => x.id)))];
  return ids
    .map((id) => {
      const ranks = rankings.map((r) => r.find((x) => x.id === id)?.rank ?? null);
      const got = ranks.filter((x): x is number => x != null);
      return {
        id,
        ranks,
        rankedIn: got.length,
        meanRank: got.length ? got.reduce((a, b) => a + b, 0) / got.length : null,
        best: got.length ? Math.min(...got) : null,
        worst: got.length ? Math.max(...got) : null,
        topCount: got.filter((x) => x <= top).length,
      };
    })
    .sort(
      (a, b) =>
        b.topCount - a.topCount ||
        b.rankedIn - a.rankedIn ||
        (a.meanRank ?? Infinity) - (b.meanRank ?? Infinity) ||
        a.id.localeCompare(b.id),
    );
}
