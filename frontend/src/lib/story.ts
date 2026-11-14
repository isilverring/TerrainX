/**
 * "Beyond the known analogs": deterministic discovery story from the dataset.
 * Statuses stay distinct; no "first discovery" or "best analog" claims are made.
 */
import type { Candidate, Dataset, Mission } from "./models";
import { labels, metricUnits } from "./data";
import { criterionNames } from "./frontier";
import type { CriterionKey } from "./frontier";

export interface StoryEntry {
  candidate: Candidate;
  role: "benchmark" | "exploratory" | "screening";
  label: string;
}

/** Lower-case only the first letter so acronyms (Q95, RMS, POWER) survive. */
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
function fmt(v: number, unit: string) {
  return `${v.toFixed(unit === "°" ? 2 : 0)}${unit === "°" ? "°" : ` ${unit}`}`;
}

/** Plain-language explanation built only from F components and criterion contributions. */
export function explainScores(c: Candidate, mission: Mission) {
  const a = c.assessments[mission];
  const parts: string[] = [];
  if (a.fidelity.value != null && a.fidelity.components.length) {
    const comps = [...a.fidelity.components].sort(
      (x, y) => y.similarity - x.similarity,
    );
    const best = comps.slice(0, 2),
      worst = comps[comps.length - 1];
    const f = (x: (typeof comps)[number]) => {
      const k = x.feature as keyof typeof labels;
      return `${lowerFirst(labels[k])} (${fmt(x.earth, metricUnits[k])} vs ${fmt(x.planet, metricUnits[k])}, s = ${x.similarity.toFixed(2)})`;
    };
    parts.push(
      `F ${a.fidelity.value.toFixed(1)}: its 24 km terrain is closest to the target in ${best.map(f).join(" and ")}; it differs most in ${f(worst)}.`,
    );
  } else
    parts.push(
      `F not assessed: ${a.fidelity.reason ?? "no compatible terrain data"}.`,
    );
  const w = a.utility.weights as Record<CriterionKey, number>;
  const contrib = (Object.keys(criterionNames) as CriterionKey[])
    .filter((k) => a.utility.criteria[k]?.value != null)
    .map((k) => ({ k, v: a.utility.criteria[k].value as number, w: w[k] }))
    .sort((x, y) => y.w * y.v - x.w * x.v);
  if (a.utility.value != null)
    parts.push(
      `U ${a.utility.value.toFixed(1)} from ${contrib
        .map(
          (x) =>
            `${lowerFirst(criterionNames[x.k])} ${x.v.toFixed(2)} (weight ${x.w.toFixed(2)})`,
        )
        .join(
          ", ",
        )}; evidence coverage ${(100 * a.utility.coverage).toFixed(0)}%.`,
    );
  return parts.join(" ");
}

export function beyondKnown(data: Dataset, mission: Mission) {
  const P = (c: Candidate) => c.assessments[mission].priority;
  const benchmarks = data.candidates
    .filter((c) => c.benchmark && P(c) != null)
    .sort((a, b) => P(b)! - P(a)!);
  const exploratory = data.candidates
    .filter(
      (c) =>
        !c.benchmark &&
        c.assessments[mission].utility.status === "CHARACTERIZED CANDIDATE" &&
        P(c) != null,
    )
    .sort((a, b) => P(b)! - P(a)! || a.id.localeCompare(b.id));
  const screening = data.candidates
    .filter((c) => !c.benchmark && c.climate.annual_precip_mm != null)
    .sort(
      (a, b) =>
        a.climate.annual_precip_mm! - b.climate.annual_precip_mm! ||
        a.id.localeCompare(b.id),
    )[0];
  const threshold = benchmarks.length
    ? Math.min(...benchmarks.map((b) => P(b)!))
    : null;
  const unexpected =
    threshold == null ? [] : exploratory.filter((c) => P(c)! >= threshold);
  return {
    bestBenchmark: benchmarks[0] ?? null,
    bestExploratory: exploratory[0] ?? null,
    topScreening: screening ?? null,
    benchmarks,
    unexpected,
    threshold,
  };
}
