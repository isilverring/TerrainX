import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Download,
  FlaskConical,
  LocateFixed,
} from "lucide-react";
import { useData, coordinates, number, statusName } from "../../lib/data";
import { download } from "../../lib/packet";
import { studyPath } from "../../lib/collections";
import type { Candidate, Mission } from "../../lib/models";
import type { EvidenceRecord, LabModule } from "../../lib/researchLab";

export type SiteContext = {
  candidate: Candidate;
  mission: Mission;
  onCandidate: (id: string) => void;
};
export function Panel({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`lab-panel ${className}`}>
      <header>
        {eyebrow && <p className="document-label">{eyebrow}</p>}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}
export function Numeric({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <label className="lab-input">
      {label}
      {unit && <small>{unit}</small>}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value.trim() === "" ? null : Number(e.target.value))
        }
      />
    </label>
  );
}
export function Metric({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="lab-metric">
      <span>{label}</span>
      <strong className="mono">
        {value ?? "—"}
        <small>{unit}</small>
      </strong>
      {hint && <p>{hint}</p>}
    </div>
  );
}
export function calculate<T>(fn: () => T): { value: T | null; error: string } {
  try {
    return { value: fn(), error: "" };
  } catch (e) {
    return { value: null, error: String(e).replace(/^Error: /, "") };
  }
}
export function InputError({ message }: { message: string }) {
  return message ? (
    <p className="lab-error" role="alert">
      {message}
    </p>
  ) : null;
}
export function References({
  records,
  candidate,
}: {
  records: EvidenceRecord[];
  candidate: Candidate;
}) {
  return (
    <div className="lab-references">
      {!records.length ? (
        <p>No source-scoped reference record in this pinned release.</p>
      ) : (
        records.map((r) => (
          <article key={r.id} className="lab-reference">
            <div className="lab-reference-head">
              <span className="evidence-tag literature-supported">
                {r.classification.replaceAll("_", " ")}
              </span>
              <span>{r.body}</span>
            </div>
            <h3>{r.title}</h3>
            <p>{r.summary}</p>
            <p className="lab-scope">
              <LocateFixed size={13} />
              {r.coordinate_scope}
              {r.latitude !== null && r.longitude !== null
                ? ` · ${coordinates({ latitude: r.latitude, longitude: r.longitude })}`
                : " · Exact numeric sample/entrance position unavailable"}
            </p>
            <p className="caption">{r.period}</p>
            {r.candidate_id !== candidate.id && (
              <p className="scientific-caveat">
                Independent reference. These observations are not measurements
                at {candidate.name} and do not change its scores.
              </p>
            )}
            {r.observations.length > 0 && (
              <div className="table-scroll">
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Published observation</th>
                      <th>Value</th>
                      <th>Method / qualifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.observations.map((o, i) => (
                      <tr key={i}>
                        <th>
                          {o.label}
                          <small>{o.scope}</small>
                        </th>
                        <td className="mono">
                          {Array.isArray(o.value)
                            ? o.value.map((v) => number(v, 2)).join(" to ")
                            : typeof o.value === "number"
                              ? number(o.value, 2)
                              : (o.value ?? "unavailable")}{" "}
                          {o.unit}
                        </td>
                        <td>
                          {o.method}
                          <small>{o.qualifier}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <details>
              <summary>Limits and scientific references</summary>
              <ul>
                {r.limitations.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
              {r.references.map((s, i) => (
                <p key={i}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                    <ArrowUpRight size={12} />
                  </a>
                  <small>
                    {s.locator} · {s.proof}
                    {s.sha256 ? ` · SHA256 ${s.sha256}` : ""}
                  </small>
                </p>
              ))}
            </details>
            <p className="lab-next">
              <b>Next measurement:</b> {r.next_measurement}
            </p>
          </article>
        ))
      )}
    </div>
  );
}

export function Outcome({
  candidate,
  mission,
  module,
  question,
  decision,
  next,
  inputs,
  results,
  sources = [],
  polarId,
}: {
  candidate: Candidate;
  mission: Mission;
  module: LabModule;
  question: string;
  decision: string;
  next: string;
  inputs: unknown;
  results: unknown;
  sources?: string[];
  polarId?: string;
}) {
  const data = useData(),
    { search } = useLocation();
  const target = data.targets.find((t) => t.id === mission)!;
  const report = {
    contract: "terrainx-research-decision-v1",
    module,
    created_at: new Date().toISOString(),
    science: data.release
      ? {
          release_id: data.release.release_id,
          dataset_sha256: data.release.dataset_sha256,
          model_version: data.release.model_version,
        }
      : null,
    collection: data.collection,
    candidate: {
      id: candidate.id,
      name: candidate.name,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      status: statusName(candidate.assessments[mission].utility.status),
    },
    target: {
      id: polarId
        ? `lunar-polar:${polarId}`
        : (target.reference_id ?? target.id),
      name: polarId ?? target.name,
    },
    question,
    decision,
    next_measurement: next,
    inputs,
    results,
    source_urls: sources,
    classification: "SOURCE-SCOPED EVIDENCE / CALCULATED MODEL / USER SCENARIO",
    not_validated: [
      "No new field campaign or experimental result has occurred.",
      "Unknowns remain unknown; candidate F/U/C are unchanged.",
      "No NASA endorsement, resource reserve, biological confirmation or route/landing clearance.",
    ],
  };
  const p = `/field-study?id=${candidate.id}&mission=${polarId ? "mare-crisium" : mission}&lab=${module}${polarId ? `&polar=${polarId}` : ""}`;
  return (
    <section className="lab-outcome">
      <p className="document-label">Research decision · {candidate.name}</p>
      <h2>{question}</h2>
      <p>{decision}</p>
      <div className="lab-next">
        <FlaskConical size={20} />
        <div>
          <b>Resolve the gap</b>
          <p>{next}</p>
        </div>
      </div>
      <div className="toolbar-actions">
        <Link className="button primary" to={studyPath(p, search)}>
          Build this field protocol
          <ArrowUpRight size={16} />
        </Link>
        <button
          className="button outline"
          onClick={() =>
            download(
              `terrainx-${module}-${candidate.id}.json`,
              JSON.stringify(report, null, 2),
              "application/json",
            )
          }
        >
          <Download size={16} />
          Export research decision
        </button>
      </div>
      <small>
        Scenarios and proposals stay separate from the selected site's
        scientific observations. Full field-study JSON retains its protocol.
      </small>
    </section>
  );
}
