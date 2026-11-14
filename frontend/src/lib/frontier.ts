/**
 * Discovery Frontier: decision sensitivity to missing evidence.
 *
 * For every missing normalized criterion s ∈ [0, 1] the declared utility model is
 * evaluated at s = 0 and s = 1 while known inputs are preserved. The endpoints are
 * hypothetical mathematical bounds under the model, never observations or predictions.
 * This is NOT an expected value of information: no probability model or measurement
 * cost model is used. Ordering rules are declared and deterministic.
 */
import type { Candidate, Mission } from "./models";

export type CriterionKey = "geology" | "terrain" | "aridity" | "temperature";
export const CRITERIA: CriterionKey[] = [
  "geology",
  "terrain",
  "aridity",
  "temperature",
];
export const criterionNames: Record<CriterionKey, string> = {
  geology: "Geological / process relevance",
  terrain: "Terrain fieldwork suitability",
  aridity: "Dry-environment conditions",
  temperature: "Earth thermal context",
};
/** Geology gates "characterized" status, so it is mission-essential for both missions. */
export const ESSENTIAL: Record<CriterionKey, boolean> = {
  geology: true,
  terrain: false,
  aridity: false,
  temperature: false,
};

export interface Bounds {
  /** Utility with every missing criterion at 0 (full weight denominator). */
  min: number;
  /** Utility with every missing criterion at 1 (full weight denominator). */
  max: number;
  /** Current renormalized (partial) utility over assessed criteria only, if any. */
  partial: number | null;
  coverage: number;
  missing: CriterionKey[];
}

/** Pure: U interval under the declared weights. Missing values never become zero in U itself. */
export function utilityBounds(
  criteria: Partial<Record<CriterionKey, { value: number | null }>>,
  weights: Record<CriterionKey, number>,
): Bounds {
  let total = 0,
    known = 0,
    knownWeight = 0,
    missingWeight = 0;
  const missing: CriterionKey[] = [];
  for (const k of CRITERIA) {
    const w = weights[k] ?? 0,
      v = criteria[k]?.value;
    if (!Number.isFinite(w) || w < 0)
      throw new Error("Weights must be finite and nonnegative");
    total += w;
    if (v == null) {
      missing.push(k);
      missingWeight += w;
    } else {
      if (!(v >= 0 && v <= 1)) throw new Error(`Criterion ${k} outside [0, 1]`);
      known += w * v;
      knownWeight += w;
    }
  }
  if (total <= 0) throw new Error("Weights must have a positive sum");
  return {
    min: (100 * known) / total,
    max: (100 * (known + missingWeight)) / total,
    partial: knownWeight > 0 ? (100 * known) / knownWeight : null,
    coverage: knownWeight / total,
    missing,
  };
}

/** Pure: combined-priority interval once the missing criteria are measured (C becomes 1). */
export function priorityBounds(
  fidelity: number | null,
  bounds: Bounds,
  alpha: number,
): { min: number; max: number } | null {
  if (fidelity == null) return null;
  return {
    min: alpha * fidelity + (1 - alpha) * bounds.min,
    max: alpha * fidelity + (1 - alpha) * bounds.max,
  };
}

/** Rank (1 = best) a value would take among reference scores (ties resolved against the candidate). */
export function rankAmong(value: number, others: number[]) {
  return 1 + others.filter((o) => o >= value).length;
}

export type Priority = "High" | "Medium" | "Low";
export interface MeasurementPlan {
  gap: string;
  why: string;
  methods: string[];
  practicality: "Field-portable" | "Field + laboratory" | "Specialist campaign";
  inModel: boolean;
}

/** Declared field-measurement templates (not generated text). */
export function measurementsFor(
  key: CriterionKey | "terrain-detail" | "regolith" | "dust",
  mission: Mission,
): MeasurementPlan {
  switch (key) {
    case "geology":
      return mission === "jezero"
        ? {
            gap: "Sedimentary / lacustrine process and mineral composition unknown",
            why: "Geology carries the largest mission weight and gates characterized status.",
            methods: [
              "Stratigraphic logging of exposed sections",
              "Sediment grain-size analysis and sampling",
              "Portable XRF and Raman spectroscopy for carbonates, sulfates and clays",
              "Laboratory petrology / XRD on collected samples",
            ],
            practicality: "Field + laboratory",
            inModel: true,
          }
        : {
            gap: "Basaltic composition and volcanic texture unknown",
            why: "Basaltic relevance carries the largest mission weight and gates characterized status.",
            methods: [
              "Portable XRF for major-element (basaltic) composition",
              "Raman spectroscopy for pyroxene / olivine / plagioclase",
              "Laboratory thin-section petrology",
              "Field mapping of flow units and vesicularity",
            ],
            practicality: "Field + laboratory",
            inModel: true,
          };
    case "terrain":
    case "terrain-detail":
      return {
        gap: "Terrain detail below the 4 km analysis lattice is unknown",
        why: "The 24 km SRTM lattice cannot see rover-scale slopes, rocks or obstacles.",
        methods: [
          "Drone photogrammetry (cm-scale DEM and orthomosaic)",
          "Terrestrial LiDAR on candidate traverse routes",
          "High-resolution differential GNSS control points",
        ],
        practicality: "Field-portable",
        inModel: key === "terrain",
      };
    case "aridity":
    case "temperature":
      return {
        gap: "Local climate differs from the coarse NASA POWER cell",
        why: "POWER is a ~55 km gridded climatology, not an on-site record.",
        methods: [
          "Automatic weather station for a full seasonal cycle",
          "Ground-surface temperature loggers",
        ],
        practicality: "Field-portable",
        inModel: true,
      };
    case "regolith":
      return {
        gap: "Regolith / soil mechanics unknown",
        why: "Traction, sinkage and slip depend on soil properties no orbital dataset here measures.",
        methods: [
          "Cone penetrometer and bevameter tests",
          "Shear-vane / direct shear tests",
          "Grain-size characterization",
          "Instrumented rover wheel-slip trials",
        ],
        practicality: "Field + laboratory",
        inModel: false,
      };
    case "dust":
      return {
        gap: "Dust characteristics unknown",
        why: "Dust affects instruments, seals and solar power; not represented in the scoring model.",
        methods: [
          "Particle-size distribution of surface fines",
          "Wind exposure and saltation logging",
          "Instrument contamination witness coupons",
        ],
        practicality: "Field-portable",
        inModel: false,
      };
  }
}

export interface FrontierRow {
  candidate: Candidate;
  bounds: Bounds;
  priorityInterval: { min: number; max: number } | null;
  /** Best fully-assessed benchmark for this mission, if any. */
  benchmark: { name: string; utility: number } | null;
  crossesBenchmark: boolean;
  /** Possible rank among candidates whose four model criteria are all assessed. */
  rankRange: { best: number; worst: number; of: number };
  swings: {
    key: CriterionKey;
    swing: number;
    weight: number;
    essential: boolean;
  }[];
  priority: Priority;
  reasons: string[];
}

export function measurementPriority(
  essential: boolean,
  crossesBenchmark: boolean,
  rankSpan: number,
): Priority {
  if (essential && (crossesBenchmark || rankSpan >= 3)) return "High";
  if (essential || crossesBenchmark || rankSpan >= 3) return "Medium";
  return "Low";
}

/** Pure: Discovery Frontier rows for one mission. */
export function fullyAssessed(c: Candidate, mission: Mission) {
  const a = c.assessments[mission];
  return (
    a.utility.value != null &&
    CRITERIA.every((k) => a.utility.criteria[k]?.value != null)
  );
}
export function frontier(
  candidates: Candidate[],
  mission: Mission,
): FrontierRow[] {
  const assessedPeers = candidates.filter(
    (c) => !c.benchmark && fullyAssessed(c, mission),
  );
  const benchmarks = candidates
    .filter((c) => c.benchmark && fullyAssessed(c, mission))
    .map((c) => ({
      name: c.name,
      utility: c.assessments[mission].utility.value!,
    }))
    .sort((a, b) => b.utility - a.utility);
  const best = benchmarks[0] ?? null;
  const rows: FrontierRow[] = [];
  for (const c of candidates) {
    if (c.benchmark) continue;
    const a = c.assessments[mission];
    const weights = a.utility.weights as Record<CriterionKey, number>;
    const bounds = utilityBounds(
      a.utility.criteria as Partial<
        Record<CriterionKey, { value: number | null }>
      >,
      weights,
    );
    if (!bounds.missing.length) continue;
    const total = CRITERIA.reduce((s, k) => s + (weights[k] ?? 0), 0);
    const swings = bounds.missing
      .map((key) => ({
        key,
        weight: weights[key] ?? 0,
        swing: (100 * (weights[key] ?? 0)) / total,
        essential: ESSENTIAL[key],
      }))
      .sort(
        (x, y) =>
          Number(y.essential) - Number(x.essential) || y.swing - x.swing,
      );
    const crossesBenchmark =
      !!best && bounds.min < best.utility && bounds.max > best.utility;
    const peers = assessedPeers
      .filter((peer) => peer.id !== c.id)
      .map((peer) => peer.assessments[mission].utility.value!);
    const rankRange = {
      best: rankAmong(bounds.max, peers),
      worst: rankAmong(bounds.min, peers),
      of: peers.length + 1,
    };
    const essential = swings.some((s) => s.essential);
    const span = rankRange.worst - rankRange.best;
    const priority = measurementPriority(essential, crossesBenchmark, span);
    const reasons: string[] = [];
    if (essential)
      reasons.push(
        "missing evidence is mission-essential (it gates characterized status)",
      );
    if (crossesBenchmark && best)
      reasons.push(
        `the U interval spans the best benchmark (${best.name}, U ${best.utility.toFixed(0)})`,
      );
    if (span >= 3)
      reasons.push(
        `measurement could move it across ${span} ranks among fully assessed candidates`,
      );
    if (!reasons.length)
      reasons.push(
        "the possible change in U is small under the declared weights",
      );
    rows.push({
      candidate: c,
      bounds,
      priorityInterval: priorityBounds(a.fidelity.value, bounds, a.alpha),
      benchmark: best,
      crossesBenchmark,
      rankRange,
      swings,
      priority,
      reasons,
    });
  }
  const order: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
  return rows.sort(
    (x, y) =>
      order[x.priority] - order[y.priority] ||
      y.bounds.max - y.bounds.min - (x.bounds.max - x.bounds.min) ||
      y.bounds.max - x.bounds.max ||
      x.candidate.id.localeCompare(y.candidate.id),
  );
}

/** Measurement plan for any candidate: missing model criteria first, then gaps outside the model. */
export function nextMeasurements(
  c: Candidate,
  mission: Mission,
): MeasurementPlan[] {
  const criteria = c.assessments[mission].utility.criteria;
  const plans = CRITERIA.filter((k) => criteria[k]?.value == null).map((k) =>
    measurementsFor(k, mission),
  );
  const beyond: ("terrain-detail" | "regolith" | "dust")[] = [
    "terrain-detail",
    "regolith",
    "dust",
  ];
  return [...plans, ...beyond.map((k) => measurementsFor(k, mission))];
}
