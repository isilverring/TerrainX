import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Telescope, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { useData, number, coordinates } from "../lib/data";
import type { Mission } from "../lib/models";
import {
  frontier,
  criterionNames,
  measurementsFor,
  fullyAssessed,
} from "../lib/frontier";
import { BackLink, EvidenceTag } from "../components/ui";
import { MarsGlyph, MoonGlyph } from "../components/glyphs";
import {
  EvidenceChips,
  IntervalChart,
  IntervalLegend,
} from "../components/FrontierParts";

export default function Frontier() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const mission: Mission =
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const target = data.targets.find((t) => t.id === mission)!;
  const rows = useMemo(
    () => frontier(data.candidates, mission),
    [data, mission],
  );
  const peers = data.candidates
    .filter((c) => !c.benchmark && fullyAssessed(c, mission))
    .map((c) => c.assessments[mission].utility.value!)
    .filter((v) => v != null);
  const crossing = rows.filter((r) => r.crossesBenchmark).length;
  const high = rows.filter((r) => r.priority === "High").length;
  return (
    <main className="document-page frontier-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">
            <Telescope size={14} /> Research gap intelligence · {target.body} /{" "}
            {target.name}
          </p>
          <h1>Discovery Frontier</h1>
          <p className="frontier-sub">
            The next breakthrough may be the next measurement.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Mission">
          <button
            className={mission === "jezero" ? "active" : ""}
            aria-pressed={mission === "jezero"}
            onClick={() => setParams({ mission: "jezero" })}
          >
            <MarsGlyph size={15} /> Mars · Jezero
          </button>
          <button
            className={mission === "mare-crisium" ? "active" : ""}
            aria-pressed={mission === "mare-crisium"}
            onClick={() => setParams({ mission: "mare-crisium" })}
          >
            <MoonGlyph size={15} /> Moon · Crisium
          </button>
        </div>
      </header>
      <blockquote className="research-question">
        What measurement should a field team collect to determine whether this
        candidate truly supports a planetary mission experiment?
      </blockquote>
      <dl className="frontier-stats">
        <div>
          <dd className="mono">{rows.length}</dd>
          <dt>research candidates requiring validation</dt>
        </div>
        <div>
          <dd className="mono">{high}</dd>
          <dt>with High measurement priority</dt>
        </div>
        <div>
          <dd className="mono">{crossing}</dd>
          <dt>whose U interval spans the best benchmark</dt>
        </div>
        <div>
          <dd className="mono">{peers.length}</dd>
          <dt>fully assessed algorithmic candidates for comparison</dt>
        </div>
      </dl>
      <section className="science-section">
        <div className="section-heading">
          <h2>Decision sensitivity to missing evidence</h2>
          <EvidenceTag kind="DERIVED" />
        </div>
        <p className="section-intro">
          For each missing criterion the declared utility model is evaluated
          with that criterion at 0 and at 1, keeping every known input. The band
          is a hypothetical mathematical bound, <strong>not</strong> a
          measurement or a prediction, and the optimistic end is not expected.
          Ordering uses declared rules (mission-essential gap, benchmark
          crossing, possible rank change), not a formal expected value of
          information.
        </p>
        <IntervalLegend />
        {rows.length ? (
          <div className="frontier-list">
            {rows.map((r) => {
              const c = r.candidate,
                a = c.assessments[mission];
              const plan = measurementsFor(r.swings[0].key, mission);
              return (
                <article
                  key={c.id}
                  className={`frontier-card priority-${r.priority.toLowerCase()}`}
                >
                  <header>
                    <span
                      className={`priority-badge ${r.priority.toLowerCase()}`}
                    >
                      {r.priority} priority
                    </span>
                    <div>
                      <h3>{c.name}</h3>
                      <p className="mono">{coordinates(c)}</p>
                    </div>
                    <span className="frontier-status">
                      Research candidate requiring validation
                    </span>
                  </header>
                  <EvidenceChips candidate={c} mission={mission} />
                  <IntervalChart
                    bounds={r.bounds}
                    benchmark={r.benchmark}
                    peers={peers}
                  />
                  <div className="frontier-text">
                    <p>
                      Missing:{" "}
                      <strong>
                        {r.bounds.missing
                          .map((k) => criterionNames[k])
                          .join(", ")}
                      </strong>{" "}
                      (weight{" "}
                      {number(
                        r.swings.reduce((s, x) => s + x.weight, 0),
                        2,
                      )}
                      ). Current partial U{" "}
                      <span className="mono">
                        {number(r.bounds.partial, 0)}
                      </span>{" "}
                      uses only {number(100 * r.bounds.coverage, 0)}% of the
                      weight. Once measured, full-model U would lie between{" "}
                      <span className="mono">{number(r.bounds.min, 0)}</span>{" "}
                      and{" "}
                      <span className="mono">{number(r.bounds.max, 0)}</span>
                      {r.priorityInterval
                        ? `, and P between ${number(r.priorityInterval.min, 0)} and ${number(r.priorityInterval.max, 0)} (F ${number(a.fidelity.value, 0)})`
                        : ""}
                      . Possible rank among {r.rankRange.of} fully assessed
                      candidates:{" "}
                      <strong>
                        #{r.rankRange.best}–#{r.rankRange.worst}
                      </strong>
                      .
                    </p>
                    <p className="frontier-why">
                      <strong>{r.priority} measurement priority</strong> because{" "}
                      {r.reasons.join("; ")}.
                    </p>
                  </div>
                  <p className="frontier-measure">
                    <strong>Measure next ({plan.practicality}):</strong>{" "}
                    {plan.methods.join(" · ")}
                  </p>
                  <div className="frontier-links">
                    <Link to={`/site/${c.id}?mission=${mission}`}>
                      Analog DNA <ArrowUpRight size={12} />
                    </Link>
                    <Link to={`/passport/${c.id}?mission=${mission}`}>
                      Passport & field plan <ArrowUpRight size={12} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">
            Every algorithmic candidate has all scored criteria assessed for
            this mission under the current weights.
          </p>
        )}
      </section>
      <section className="science-section">
        <div className="section-heading">
          <h2>Gaps outside the scoring model (every candidate)</h2>
          <EvidenceTag kind="ASSUMED" />
        </div>
        <div className="beyond-grid">
          {(["terrain-detail", "regolith", "dust"] as const).map((k) => {
            const p = measurementsFor(k, mission);
            return (
              <div key={k}>
                <h3>{p.gap}</h3>
                <p>{p.why}</p>
                <ul>
                  {p.methods.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <small>{p.practicality}</small>
              </div>
            );
          })}
        </div>
      </section>
      <p className="scientific-warning frontier-caveat">
        <TriangleAlert size={14} /> Missing evidence is not proof of promising
        geology. No candidate here is claimed as a newly discovered planetary
        analog; each is a research candidate requiring independent field
        verification.
      </p>
    </main>
  );
}
