import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Columns3, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  useData,
  coordinates,
  labels,
  unitSuffix,
  number,
  statusName,
} from "../lib/data";
import type { Candidate, Mission } from "../lib/models";
import { BackLink, EvidenceTag } from "../components/ui";
import { MarsGlyph, MoonGlyph } from "../components/glyphs";
import { comparisonIds } from "../lib/discoveryState";
import { studyPath } from "../lib/collections";

const MAX_COMPARE = 3;

function Bar({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="not-assessed">not assessed</span>;
  return (
    <span className="compare-bar">
      <b className="mono">{number(value, 0)}</b>
      <i>
        <em style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </i>
    </span>
  );
}
function Row({
  label,
  hint,
  target,
  cells,
}: {
  label: string;
  hint?: string;
  target?: ReactNode;
  cells: ReactNode[];
}) {
  return (
    <tr>
      <th scope="row">
        {label}
        {hint ? <small>{hint}</small> : null}
      </th>
      {target !== undefined ? <td className="target-cell">{target}</td> : null}
      {cells.map((cell, i) => (
        <td key={i}>{cell}</td>
      ))}
    </tr>
  );
}
function GroupHeader({
  title,
  span,
  tag,
}: {
  title: string;
  span: number;
  tag?: string;
}) {
  return (
    <tr className="compare-group">
      <th colSpan={span}>
        {title}
        {tag ? <EvidenceTag kind={tag} /> : null}
      </th>
    </tr>
  );
}
const criterionLabels: Record<string, string> = {
  geology: "Geological / process relevance",
  terrain: "Terrain fieldwork suitability",
  aridity: "Dry-environment conditions",
  temperature: "Earth thermal context",
};

export default function Compare() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const mission: Mission =
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const rawIds = params.get("ids") ?? "";
  const ids = comparisonIds(
    rawIds,
    data.candidates.map((c) => c.id),
    MAX_COMPARE,
  );
  const picked = ids
    .map((id) => data.candidates.find((c) => c.id === id))
    .filter((c): c is Candidate => !!c);
  const target = data.targets.find((t) => t.id === mission)!;
  const setIds = (next: string[]) => {
    const p = new URLSearchParams(params);
    p.set("ids", next.join(","));
    p.set("atlas_compare", next.join(",") || ",");
    setParams(p);
  };
  const chooseMission = (next: Mission) => {
    const p = new URLSearchParams(params);
    p.set("mission", next);
    setParams(p);
  };
  const span = picked.length + 2;
  const climate = (c: Candidate) => c.climate;
  return (
    <main className="document-page compare-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">
            <Columns3 size={14} /> Side-by-side evidence · {target.body} /{" "}
            {target.name}
          </p>
          <h1>Compare candidates</h1>
          <p>
            Inspect observations, evidence gaps and model scores side by side.
            F, U and C answer different questions. A partial utility score is
            not equivalent to a well-supported assessment.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Mission">
          <button
            className={mission === "jezero" ? "active" : ""}
            aria-pressed={mission === "jezero"}
            disabled={!!data.target_reference}
            title={
              data.target_reference
                ? "Leave the lunar polar reference before selecting Mars"
                : undefined
            }
            onClick={() => chooseMission("jezero")}
          >
            <MarsGlyph size={15} /> Mars · Jezero
          </button>
          <button
            className={mission === "mare-crisium" ? "active" : ""}
            aria-pressed={mission === "mare-crisium"}
            onClick={() => chooseMission("mare-crisium")}
          >
            <MoonGlyph size={15} /> Moon ·{" "}
            {data.targets.find((t) => t.id === "mare-crisium")?.name}
          </button>
        </div>
      </header>
      {rawIds
        .split(",")
        .filter(Boolean)
        .some((id) => !data.candidates.some((c) => c.id === id)) && (
        <p className="warning-inline" role="status">
          Unavailable comparison sites were excluded from this collection; no
          measurements were substituted.
        </p>
      )}
      {picked.length < 2 ? (
        <section className="science-section">
          <p>
            Pick two or three candidates with the compare toggle in the
            Discovery list.
          </p>
          <Link
            className="button primary"
            to={studyPath(`/explorer?mission=${mission}`, params.toString())}
          >
            Open Discovery
          </Link>
        </section>
      ) : (
        <div className="table-scroll compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col" className="corner">
                  Evidence
                </th>
                <th scope="col" className="target-cell">
                  <span className="compare-kicker">Planetary target</span>
                  <strong>{target.name}</strong>
                  <span className="mono">
                    {target.body} · {coordinates(target)}
                  </span>
                </th>
                {picked.map((c) => {
                  const a = c.assessments[mission];
                  return (
                    <th scope="col" key={c.id}>
                      <span
                        className={`compare-kicker ${c.benchmark ? "benchmark" : a.utility.status === "CHARACTERIZED CANDIDATE" ? "characterized" : "screened"}`}
                      >
                        {statusName(a.utility.status)}
                      </span>
                      <strong>{c.name}</strong>
                      <span className="mono">{coordinates(c)}</span>
                      <span className="compare-links">
                        <Link
                          to={studyPath(
                            `/site/${c.id}?mission=${mission}&atlas_id=${c.id}`,
                            params.toString(),
                          )}
                        >
                          Analog DNA <ArrowUpRight size={12} />
                        </Link>
                        <button
                          onClick={() => setIds(ids.filter((x) => x !== c.id))}
                          aria-label={`Remove ${c.name} from comparison`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <GroupHeader title="Separate scores" span={span} />
              <Row
                label="F · terrain fidelity"
                hint="24 km broad-scale terrain vs target"
                target="—"
                cells={picked.map((c) => (
                  <Bar value={c.assessments[mission].fidelity.value} />
                ))}
              />
              <Row
                label="U · mission utility"
                hint="declared, adjustable model"
                target="—"
                cells={picked.map((c) => (
                  <Bar value={c.assessments[mission].utility.value} />
                ))}
              />
              <Row
                label="C · evidence coverage"
                hint="share of criterion weight assessed"
                target="—"
                cells={picked.map((c) => {
                  const cov = c.assessments[mission].utility.coverage;
                  return (
                    <span className={cov < 0.7 ? "coverage-low" : ""}>
                      <Bar value={100 * cov} />
                      {cov < 0.7 ? (
                        <small>
                          {c.assessments[mission].utility.value == null
                            ? "U not assessed"
                            : "U is partial"}
                        </small>
                      ) : null}
                    </span>
                  );
                })}
              />
              <Row
                label="P · combined priority"
                hint="only when F and U are valid and C ≥ 70 %"
                target="—"
                cells={picked.map((c) => (
                  <Bar value={c.assessments[mission].priority} />
                ))}
              />
              <GroupHeader
                title="Mission utility criteria (0–1)"
                span={span}
                tag="ASSUMED"
              />
              {Object.keys(criterionLabels).map((key) => (
                <Row
                  key={key}
                  label={criterionLabels[key]}
                  hint={`weight ${number(picked[0].assessments[mission].utility.weights[key], 2)}`}
                  target="—"
                  cells={picked.map((c) => {
                    const v =
                      c.assessments[mission].utility.criteria[key]?.value;
                    return v == null ? (
                      <span className="not-assessed">unknown</span>
                    ) : (
                      <span className="mono">{number(v, 2)}</span>
                    );
                  })}
                />
              ))}
              <GroupHeader
                title="Terrain · 7×7 at 4 km (24 km)"
                span={span}
                tag="DERIVED"
              />
              {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
                <Row
                  key={k}
                  label={labels[k]}
                  target={
                    <span className="mono">
                      {number(target.terrain.metrics?.[k], 1)}
                      {unitSuffix(k)}
                    </span>
                  }
                  cells={picked.map((c) => (
                    <span className="mono">
                      {number(c.terrain.metrics?.[k], 1)}
                      {unitSuffix(k)}
                    </span>
                  ))}
                />
              ))}
              <GroupHeader
                title="Climate · NASA POWER 2001–2025"
                span={span}
                tag="MEASURED"
              />
              <Row
                label="Annual precipitation proxy"
                hint="365.25 × mean daily rate"
                target="n/a"
                cells={picked.map((c) => (
                  <span className="mono">
                    {number(climate(c).annual_precip_mm, 0)} mm/yr
                  </span>
                ))}
              />
              <Row
                label="Mean air temperature (2 m)"
                target="n/a"
                cells={picked.map((c) => (
                  <span className="mono">
                    {number(climate(c).T2M?.value, 1)} °C
                  </span>
                ))}
              />
              <Row
                label="Seasonal range of monthly means"
                hint="not the daily swing"
                target="n/a"
                cells={picked.map((c) => (
                  <span className="mono">
                    {number(climate(c).seasonal_temperature_range_c, 1)} °C
                  </span>
                ))}
              />
              <Row
                label="Wind at 10 m"
                target="n/a"
                cells={picked.map((c) => (
                  <span className="mono">
                    {number(climate(c).WS10M?.value, 1)} m/s
                  </span>
                ))}
              />
              <Row
                label="All-sky surface shortwave"
                target="n/a"
                cells={picked.map((c) => (
                  <span className="mono">
                    {number(climate(c).ALLSKY_SFC_SW_DWN?.value, 1)}{" "}
                    {climate(c).ALLSKY_SFC_SW_DWN?.unit ?? ""}
                  </span>
                ))}
              />
              <GroupHeader
                title="Geology · Macrostrat mapped units"
                span={span}
                tag="LITERATURE-SUPPORTED"
              />
              <Row
                label="Mapped lithology"
                hint="map evidence, not field mineralogy"
                target="n/a"
                cells={picked.map((c) => {
                  const units = c.geology.units as {
                    lith?: string;
                    best_int_name?: string;
                    name?: string;
                  }[];
                  const liths = [
                    ...new Set(
                      units
                        .map(
                          (u) =>
                            `${u.lith || u.name || "unnamed unit"}${u.best_int_name ? ` · ${u.best_int_name}` : ""}`,
                        )
                        .filter(Boolean),
                    ),
                  ].slice(0, 3);
                  return liths.length ? (
                    <span className="lith-list">
                      {liths.map((l) => (
                        <span key={l}>{l}</span>
                      ))}
                    </span>
                  ) : (
                    <span className="not-assessed">
                      Geology requires verification
                    </span>
                  );
                })}
              />
              <Row
                label="Relevance rationale"
                target="n/a"
                cells={picked.map((c) => (
                  <small className="rationale">
                    {c.assessments[mission].utility.criteria.geology.rationale}
                  </small>
                ))}
              />
              <GroupHeader title="Reality gap" span={span} />
              <Row
                label="Matches / mismatches / missing"
                target="—"
                cells={picked.map((c) => {
                  const g = c.assessments[mission].reality_gap;
                  return (
                    <span className="mono">
                      {g.match.length} / {g.mismatch.length} /{" "}
                      {g.missing.length}
                    </span>
                  );
                })}
              />
            </tbody>
          </table>
        </div>
      )}
      <p className="caption compare-caption">
        Climate and geology have no planetary counterpart in this model (n/a).
        Terrain metrics compare relative shape only; absolute elevations use
        different datums. Benchmarks are references and never count as new
        discoveries.
      </p>
    </main>
  );
}
