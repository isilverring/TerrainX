import { createContext, useContext } from "react";
import type { Candidate, Dataset, Mission } from "./models";
import { defaultScenario, scoreCandidate } from "./counterfactual";
import type { Scenario } from "./counterfactual";
export type Weights = Record<
  "geology" | "terrain" | "aridity" | "temperature",
  number
>;
export const defaultWeights: Record<Mission, Weights> = {
  jezero: { geology: 0.55, terrain: 0.2, aridity: 0.15, temperature: 0.1 },
  "mare-crisium": {
    geology: 0.55,
    terrain: 0.3,
    aridity: 0.1,
    temperature: 0.05,
  },
};
export function validWeights(weights: unknown): weights is Weights {
  if (!weights || typeof weights !== "object") return false;
  const w = weights as Weights;
  return (
    Object.keys(w).length === 4 &&
    ["geology", "terrain", "aridity", "temperature"].every(
      (k) =>
        Number.isFinite(w[k as keyof Weights]) && w[k as keyof Weights] >= 0,
    ) &&
    Math.abs(Object.values(w).reduce((s, v) => s + v, 0) - 1) < 1e-6
  );
}
export function rebalanceWeight(
  weights: Weights,
  key: keyof Weights,
  value: number,
): Weights {
  const next = { ...weights, [key]: Math.min(1, Math.max(0, value)) },
    otherTotal = 1 - weights[key];
  for (const criterion of Object.keys(weights) as (keyof Weights)[])
    if (criterion !== key)
      next[criterion] =
        otherTotal > 1e-9
          ? (weights[criterion] * (1 - next[key])) / otherTotal
          : (1 - next[key]) / 3;
  return next;
}
export function applyWeights(
  data: Dataset,
  weights: Record<Mission, Weights>,
): Dataset {
  return applyScenarios(data, {
    jezero: { ...defaultScenario("jezero"), weights: weights.jezero },
    "mare-crisium": {
      ...defaultScenario("mare-crisium"),
      weights: weights["mare-crisium"],
    },
  });
}
export function applyScenarios(
  data: Dataset,
  scenarios: Record<Mission, Scenario>,
): Dataset {
  const candidates = data.candidates.map((candidate) => {
    const c: Candidate = {
      ...candidate,
      assessments: { ...candidate.assessments },
    };
    for (const mission of ["jezero", "mare-crisium"] as Mission[]) {
      const original = candidate.assessments[mission],
        criteria = original.utility.criteria,
        s = scenarios[mission],
        w = s.weights;
      let assessed = 0;
      for (const key of Object.keys(w) as (keyof Weights)[]) {
        const v = criteria[key].value;
        if (v !== null) {
          assessed += w[key];
        }
      }
      const result = scoreCandidate(candidate, mission, s);
      const value = result.U,
        geo = criteria.geology.value,
        threshold = Math.max(0.7, s.minCoverage);
      const status = c.benchmark
        ? "REFERENCE ANALOG"
        : assessed >= threshold - 1e-12 && geo !== null && geo >= 0.5
          ? "CHARACTERIZED CANDIDATE"
          : "SCREENED CANDIDATE";
      const utility = {
        ...original.utility,
        weights: w,
        value,
        coverage: assessed,
        status,
        evidence_label:
          assessed >= threshold - 1e-12 && geo !== null
            ? "Sufficient for preliminary hypothesis"
            : "Insufficient evidence",
      };
      c.assessments[mission] = {
        ...original,
        utility,
        alpha: s.alpha,
        gamma: s.gamma,
        minimum_coverage: threshold,
        fidelity: {
          ...original.fidelity,
          value: result.F,
          components: original.fidelity.components.map((comp) => {
            const tolerance =
              s.tolerances[comp.feature as keyof Scenario["tolerances"]];
            return {
              ...comp,
              tolerance,
              similarity: Math.exp(
                -0.5 * ((comp.earth - comp.planet) / tolerance) ** 2,
              ),
            };
          }),
        },
        priority: result.P,
        experiment: {
          ...original.experiment,
          evidence_gate:
            geo !== null && assessed >= threshold - 1e-12
              ? "Preliminary test hypothesis"
              : "Verification-first proposal; insufficient geological evidence",
        },
      };
    }
    c.status = c.benchmark
      ? "REFERENCE ANALOG"
      : Object.values(c.assessments).some(
            (a) => a.utility.status === "CHARACTERIZED CANDIDATE",
          )
        ? "CHARACTERIZED CANDIDATE"
        : "SCREENED CANDIDATE";
    return c;
  });
  return {
    ...data,
    candidates,
    summary: {
      ...data.summary,
      characterized_candidates: candidates.filter(
        (c) => c.status === "CHARACTERIZED CANDIDATE",
      ).length,
    },
  };
}
export const ModelContext = createContext<{
  weights: Record<Mission, Weights>;
  scenarios: Record<Mission, Scenario>;
  update: (mission: Mission, patch: Partial<Scenario>) => void;
  replace: (scenarios: Record<Mission, Scenario>) => void;
  change: (mission: Mission, key: keyof Weights, value: number) => void;
  reset: (mission: Mission) => void;
}>({
  weights: defaultWeights,
  scenarios: {
    jezero: defaultScenario("jezero"),
    "mare-crisium": defaultScenario("mare-crisium"),
  },
  update: () => {},
  replace: () => {},
  change: () => {},
  reset: () => {},
});
export function useModel() {
  return useContext(ModelContext);
}
export function storedWeights() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("terrainx-weights-v1") ?? "null",
    );
    if (
      saved &&
      validWeights(saved.jezero) &&
      validWeights(saved["mare-crisium"])
    )
      return saved as Record<Mission, Weights>;
  } catch {
    /* Invalid or unavailable storage uses documented defaults. */
  }
  return defaultWeights;
}
export function validScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== "object") return false;
  const s = value as Scenario;
  return (
    validWeights(s.weights) &&
    Number.isFinite(s.alpha) &&
    s.alpha >= 0 &&
    s.alpha <= 1 &&
    Number.isFinite(s.gamma) &&
    s.gamma > 0 &&
    Number.isFinite(s.minCoverage) &&
    s.minCoverage >= 0.7 &&
    s.minCoverage <= 1 &&
    Object.keys(defaultScenario("jezero").tolerances).every(
      (key) =>
        Number.isFinite(s.tolerances?.[key as keyof Scenario["tolerances"]]) &&
        s.tolerances[key as keyof Scenario["tolerances"]] > 0,
    )
  );
}
export function storedScenarios(): Record<Mission, Scenario> {
  let initial: Record<Mission, Scenario> | undefined;
  try {
    const saved = JSON.parse(
      localStorage.getItem("terrainx-scenarios-v1") ?? "null",
    );
    if (validScenario(saved?.jezero) && validScenario(saved?.["mare-crisium"]))
      initial = saved;
  } catch {
    /* Optional browser storage. */
  }
  const weights = storedWeights();
  const scenarios = initial ?? {
    jezero: { ...defaultScenario("jezero"), weights: weights.jezero },
    "mare-crisium": {
      ...defaultScenario("mare-crisium"),
      weights: weights["mare-crisium"],
    },
  };
  try {
    const params = new URLSearchParams(window.location.hash.split("?")[1]);
    const incoming = JSON.parse(params.get("model") ?? "null");
    const mission =
      params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
    if (validScenario(incoming)) scenarios[mission] = incoming;
  } catch {
    /* A malformed shared model never replaces validated defaults. */
  }
  return scenarios;
}
