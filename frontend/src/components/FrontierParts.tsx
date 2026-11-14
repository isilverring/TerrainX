import { Check, CircleHelp, FlaskConical, Ruler } from "lucide-react";
import type { Candidate, Mission } from "../lib/models";
import {
  criterionNames,
  nextMeasurements,
  utilityBounds,
} from "../lib/frontier";
import type { Bounds, CriterionKey, FrontierRow } from "../lib/frontier";
import { number } from "../lib/data";
import { EvidenceTag } from "./ui";

/** 0–100 interval chart: hypothetical U bounds, current partial U, benchmark and peers. */
export function IntervalChart({
  bounds,
  benchmark,
  peers = [],
  height = 46,
}: {
  bounds: Bounds;
  benchmark?: { name: string; utility: number } | null;
  peers?: number[];
  height?: number;
}) {
  const x = (v: number) => `${Math.max(0, Math.min(100, v))}%`;
  return (
    <div
      className="interval-chart"
      style={{ height }}
      role="img"
      aria-label={`Hypothetical utility bounds ${number(bounds.min, 0)} to ${number(bounds.max, 0)}${bounds.partial != null ? `; current partial U ${number(bounds.partial, 0)}` : ""}${benchmark ? `; best benchmark ${benchmark.name} U ${number(benchmark.utility, 0)}` : ""}`}
    >
      <div className="ic-axis" />
      {[0, 25, 50, 75, 100].map((t) => (
        <span key={t} className="ic-tick" style={{ left: x(t) }}>
          {t}
        </span>
      ))}
      {peers.map((p, i) => (
        <i key={i} className="ic-peer" style={{ left: x(p) }} />
      ))}
      <div
        className="ic-band"
        style={{
          left: x(bounds.min),
          width: `${Math.max(0.6, bounds.max - bounds.min)}%`,
        }}
      >
        <b className="mono ic-min">{number(bounds.min, 0)}</b>
        <b className="mono ic-max">{number(bounds.max, 0)}</b>
      </div>
      {bounds.partial != null ? (
        <i
          className="ic-partial"
          style={{ left: x(bounds.partial) }}
          title="Current partial U"
        />
      ) : null}
      {benchmark ? (
        <span className="ic-bench" style={{ left: x(benchmark.utility) }}>
          <em>{benchmark.name}</em>
        </span>
      ) : null}
    </div>
  );
}

export function IntervalLegend() {
  return (
    <div className="interval-legend">
      <span>
        <i className="lg-band" /> hypothetical U bounds if missing evidence were
        0…1
      </span>
      <span>
        <i className="lg-partial" /> current partial U (assessed weight only)
      </span>
      <span>
        <i className="lg-bench" /> best fully assessed benchmark
      </span>
      <span>
        <i className="lg-peer" /> fully assessed algorithmic candidates
      </span>
    </div>
  );
}

export function EvidenceChips({
  candidate,
  mission,
}: {
  candidate: Candidate;
  mission: Mission;
}) {
  const criteria = candidate.assessments[mission].utility.criteria;
  const chips: [string, boolean][] = [
    ["NASA POWER climate", candidate.climate.annual_precip_mm != null],
    ["SRTM terrain", candidate.terrain.status === "available"],
    ["Macrostrat units returned", candidate.geology.status === "mapped"],
    ...(Object.keys(criterionNames) as CriterionKey[]).map(
      (k) =>
        [`${criterionNames[k]} scored`, criteria[k]?.value != null] as [
          string,
          boolean,
        ],
    ),
  ];
  return (
    <ul className="evidence-chips" aria-label="Evidence status">
      {chips.map(([label, ok]) => (
        <li key={label} className={ok ? "ok" : "missing"}>
          {ok ? <Check size={11} /> : <CircleHelp size={11} />}
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Passport / Expedition section: "What should we measure next?" */
export function MeasureNext({
  candidate,
  mission,
  row,
}: {
  candidate: Candidate;
  mission: Mission;
  row?: FrontierRow;
}) {
  const a = candidate.assessments[mission];
  const bounds = utilityBounds(
    a.utility.criteria,
    a.utility.weights as Record<CriterionKey, number>,
  );
  const plans = nextMeasurements(candidate, mission);
  return (
    <section className="science-section measure-next">
      <div className="section-heading">
        <h2>What should we measure next?</h2>
        <EvidenceTag kind="ASSUMED" />
      </div>
      <p className="section-intro">
        The next breakthrough may be the next measurement. Missing evidence is
        not proof of promising geology.
        {bounds.missing.length
          ? " This is a research candidate requiring validation."
          : " All scored criteria are assessed; field verification is still required."}
      </p>
      {bounds.missing.length ? (
        <div className="measure-interval">
          <p>
            Missing in the scoring model:{" "}
            <strong>
              {bounds.missing.map((k) => criterionNames[k]).join(", ")}
            </strong>
            . Under the declared weights, full-model U would lie between{" "}
            <strong className="mono">{number(bounds.min, 0)}</strong> and{" "}
            <strong className="mono">{number(bounds.max, 0)}</strong> once
            measured. These are hypothetical mathematical bounds, not
            predictions.
            {row
              ? ` Measurement priority: ${row.priority} — ${row.reasons.join("; ")}.`
              : ""}
          </p>
          <IntervalChart bounds={bounds} benchmark={row?.benchmark} />
        </div>
      ) : null}
      <ol className="measure-list">
        {plans.map((p) => (
          <li key={p.gap}>
            <div className="measure-head">
              {p.inModel ? <FlaskConical size={15} /> : <Ruler size={15} />}
              <strong>{p.gap}</strong>
              <span className={`practicality ${p.inModel ? "in-model" : ""}`}>
                {p.inModel ? "scored criterion" : "outside the scoring model"} ·{" "}
                {p.practicality}
              </span>
            </div>
            <p>{p.why}</p>
            <ul>
              {p.methods.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
