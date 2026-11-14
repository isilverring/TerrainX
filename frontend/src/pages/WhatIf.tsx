import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Minus,
  RotateCcw,
  Shuffle,
  SlidersHorizontal,
} from "lucide-react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useData, number } from "../lib/data";
import type { Mission } from "../lib/models";
import {
  DEFAULT_TOLERANCES,
  FEATURES,
  defaultScenario,
  explain,
  paretoFront,
  robustness,
  scoreCandidate,
} from "../lib/counterfactual";
import type { FeatureKey, Scenario } from "../lib/counterfactual";
import { CRITERIA, criterionNames } from "../lib/frontier";
import type { CriterionKey } from "../lib/frontier";
import { rebalanceWeight } from "../lib/scoring";
import { labels, metricUnits } from "../lib/data";
import { BackLink, EvidenceTag } from "../components/ui";
import { MarsGlyph, MoonGlyph } from "../components/glyphs";

const SOURCES: Record<CriterionKey, [string, string]> = {
  geology: [
    "LITERATURE-SUPPORTED",
    "Macrostrat mapped units and cited literature; unknown stays unknown",
  ],
  terrain: ["DERIVED", "NASA SRTM 7×7 lattice (p90 slope)"],
  aridity: ["MEASURED", "NASA POWER precipitation (annual proxy)"],
  temperature: ["MEASURED", "NASA POWER 2 m air temperature"],
};

function Range({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  hint?: React.ReactNode;
}) {
  return (
    <label className="lab-slider" htmlFor={id}>
      <span>
        {label}
        <b className="mono">{display}</b>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <small className="range-hint">{hint}</small> : null}
    </label>
  );
}

export default function WhatIf() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const mission: Mission =
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const base = useMemo(() => defaultScenario(mission), [mission]);
  const [scenarios, setScenarios] = useState<Record<Mission, Scenario>>({
    jezero: defaultScenario("jezero"),
    "mare-crisium": defaultScenario("mare-crisium"),
  });
  const s = scenarios[mission];
  const update = (patch: Partial<Scenario>) =>
    setScenarios((all) => ({
      ...all,
      [mission]: { ...all[mission], ...patch },
    }));
  const [range, setRange] = useState(0.25),
    [seed, setSeed] = useState(20261003);

  const rows = useMemo(
    () => explain(data.candidates, mission, base, s),
    [data, mission, base, s],
  );
  const ranked = rows
    .filter((r) => r.after.rank != null)
    .sort((a, b) => a.after.rank! - b.after.rank!);
  const unranked = rows.filter((r) => r.after.rank == null);
  const points = data.candidates
    .map((c) => ({ c, r: scoreCandidate(c, mission, s) }))
    .filter(({ r }) => r.F != null && r.U != null)
    .map(({ c, r }) => ({
      id: c.id,
      name: c.name,
      F: r.F!,
      U: r.U!,
      C: r.C,
      benchmark: c.benchmark,
      enough: r.C >= s.minCoverage - 1e-12 && r.geologyAssessed,
    }));
  const frontier = paretoFront(
    points.filter((p) => p.enough && !p.benchmark),
  ).sort((a, b) => a.F - b.F);
  const changed = JSON.stringify(s) !== JSON.stringify(base);
  const frontierIds = new Set(frontier.map((p) => p.id));
  const stability = useMemo(
    () =>
      robustness(data.candidates, mission, s, { range, seed, scenarios: 200 }),
    [data, mission, s, range, seed],
  );
  const target = data.targets.find((t) => t.id === mission)!;
  const maxRank = Math.max(1, ...stability.stats.map((x) => x.worst));
  return (
    <main className="document-page whatif-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">
            <SlidersHorizontal size={14} /> Counterfactual mission explorer ·{" "}
            {target.body} / {target.name}
          </p>
          <h1>What if the mission changes?</h1>
          <p className="frontier-sub">
            Every number is recomputed from stored inputs with the pipeline’s
            own equations.
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

      <div className="whatif-layout">
        <aside className="whatif-controls" aria-label="Model settings">
          <h2>Model settings</h2>
          <Range
            id="wi-alpha"
            label="F vs U importance α"
            value={s.alpha}
            min={0}
            max={1}
            step={0.05}
            display={`α = ${s.alpha.toFixed(2)}`}
            onChange={(alpha) => update({ alpha })}
            hint={`P = (α·F + (1−α)·U)·C · default ${base.alpha}`}
          />
          <h3>Mission criterion weights</h3>
          {CRITERIA.map((k) => (
            <Range
              key={k}
              id={`wi-w-${k}`}
              label={criterionNames[k]}
              value={s.weights[k]}
              min={0}
              max={1}
              step={0.05}
              display={s.weights[k].toFixed(2)}
              onChange={(v) =>
                update({ weights: rebalanceWeight(s.weights, k, v) })
              }
              hint={
                <>
                  <EvidenceTag kind={SOURCES[k][0]} /> {SOURCES[k][1]}
                </>
              }
            />
          ))}
          <Range
            id="wi-minc"
            label="Minimum evidence coverage"
            value={s.minCoverage}
            min={0.4}
            max={1}
            step={0.05}
            display={`${(100 * s.minCoverage).toFixed(0)}%`}
            onChange={(minCoverage) => update({ minCoverage })}
            hint="Candidates below this coverage, or with unknown geology, are never ranked."
          />
          <h3>Similarity tolerances τ</h3>
          {FEATURES.map((f) => (
            <Range
              key={f}
              id={`wi-t-${f}`}
              label={labels[f]}
              value={s.tolerances[f]}
              min={DEFAULT_TOLERANCES[f] * 0.25}
              max={DEFAULT_TOLERANCES[f] * 3}
              step={DEFAULT_TOLERANCES[f] * 0.05}
              display={`${number(s.tolerances[f], f.endsWith("deg") ? 2 : 0)} ${metricUnits[f]}`}
              onChange={(v) =>
                update({
                  tolerances: { ...s.tolerances, [f]: v } as Record<
                    FeatureKey,
                    number
                  >,
                })
              }
            />
          ))}
          <button
            className="button outline reset-btn"
            onClick={() => update(defaultScenario(mission))}
          >
            <RotateCcw size={14} /> Reset to release defaults
          </button>
        </aside>

        <div className="whatif-main">
          <section className="science-section">
            <div className="section-heading">
              <h2>Before and after</h2>
              <EvidenceTag kind="DERIVED" />
            </div>
            <p className="section-intro">
              Screening priority P among evidence-eligible algorithmic
              candidates (benchmarks are references and are not ranked here).
              Explanations come from an exact decomposition of ΔP into the α,
              tolerance and weight changes, not from guessed causes.
            </p>
            {ranked.length ? (
              <div className="table-scroll">
                <table className="whatif-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>P before → after</th>
                      <th>F · U · C</th>
                      <th>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((r) => (
                      <tr key={r.id}>
                        <td className="rank-cell">
                          <span className="mono">
                            {r.before.rank ?? "—"} →{" "}
                            <strong>{r.after.rank}</strong>
                          </span>
                          {r.rankDelta == null ? null : r.rankDelta > 0 ? (
                            <ArrowUp
                              size={14}
                              className="up"
                              aria-label={`up ${r.rankDelta}`}
                            />
                          ) : r.rankDelta < 0 ? (
                            <ArrowDown
                              size={14}
                              className="down"
                              aria-label={`down ${-r.rankDelta}`}
                            />
                          ) : (
                            <Minus
                              size={14}
                              className="same"
                              aria-label="unchanged"
                            />
                          )}
                        </td>
                        <td>
                          <Link to={`/site/${r.id}?mission=${mission}`}>
                            {r.after.candidate.name}
                          </Link>
                        </td>
                        <td className="mono">
                          {number(r.before.P, 1)} → {number(r.after.P, 1)}
                          {r.pDelta != null && Math.abs(r.pDelta) >= 0.05 ? (
                            <small className={r.pDelta > 0 ? "up" : "down"}>
                              {" "}
                              ({r.pDelta > 0 ? "+" : ""}
                              {r.pDelta.toFixed(1)})
                            </small>
                          ) : null}
                        </td>
                        <td className="mono">
                          {number(r.after.F, 0)} · {number(r.after.U, 0)} ·{" "}
                          {number(100 * r.after.C, 0)}%
                        </td>
                        <td className="why-cell">
                          {changed ? (
                            r.sentence
                          ) : (
                            <span className="muted">
                              Release defaults — adjust a setting to compare.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">
                No algorithmic candidate is rankable under these settings. For
                the Moon this is the honest result: no automatic candidate has
                assessed basaltic geology, so none can be ranked as a geological
                analog.
              </p>
            )}
            {unranked.length ? (
              <details className="unranked">
                <summary>
                  {unranked.length} candidate{unranked.length > 1 ? "s" : ""}{" "}
                  not ranked (reasons)
                </summary>
                <ul>
                  {unranked.map((r) => (
                    <li key={r.id}>
                      <strong>{r.after.candidate.name}</strong> —{" "}
                      {r.after.reason}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>

          <section className="science-section">
            <div className="section-heading">
              <h2>Pareto frontier · F against U</h2>
              <EvidenceTag kind="DERIVED" />
            </div>
            <p className="section-intro">
              A candidate is on the frontier when no other evidence-eligible
              candidate is at least as good in both F and U and strictly better
              in one. Several frontier points mean several useful field-test
              options, not one universal winner.
            </p>
            <ul className="pareto-legend">
              <li>
                <i className="pl-front" /> Pareto frontier (nondominated)
              </li>
              <li>
                <i className="pl-dom" /> Evidence-eligible, dominated
              </li>
              <li>
                <i className="pl-low" /> Low coverage or geology unknown
                (partial U, excluded)
              </li>
              <li>
                <i className="pl-bench" /> Benchmark reference (not ranked)
              </li>
            </ul>
            <div className="pareto-chart">
              <ResponsiveContainer width="100%" height={360}>
                <ScatterChart
                  margin={{ top: 10, right: 20, bottom: 28, left: 6 }}
                >
                  <CartesianGrid stroke="#223247" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="F"
                    name="F"
                    domain={[0, 100]}
                    stroke="#97A8BD"
                    fontSize={11}
                    label={{
                      value: "Terrain fidelity F",
                      position: "insideBottom",
                      offset: -14,
                      fill: "#97A8BD",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="U"
                    name="U"
                    domain={[0, 100]}
                    stroke="#97A8BD"
                    fontSize={11}
                    label={{
                      value: "Mission utility U",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#97A8BD",
                      fontSize: 11,
                    }}
                  />
                  <ZAxis range={[70, 70]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{
                      background: "#0b1322",
                      border: "1px solid #3a4b63",
                      fontSize: 12,
                    }}
                    formatter={(v, n) => [Number(v).toFixed(1), n]}
                    labelFormatter={() => ""}
                    content={({ payload }) =>
                      payload?.length ? (
                        <div className="chart-tip">
                          <strong>
                            {(payload[0].payload as { name: string }).name}
                          </strong>
                          <span className="mono">
                            F{" "}
                            {(payload[0].payload as { F: number }).F.toFixed(1)}{" "}
                            · U{" "}
                            {(payload[0].payload as { U: number }).U.toFixed(1)}{" "}
                            · C{" "}
                            {(
                              100 * (payload[0].payload as { C: number }).C
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                      ) : null
                    }
                  />
                  <Scatter
                    name="Pareto frontier"
                    data={points.filter((p) => frontierIds.has(p.id))}
                    fill="#35C3B0"
                    line={{ stroke: "#35C3B0", strokeDasharray: "4 3" }}
                    lineType="joint"
                    shape="circle"
                  />
                  <Scatter
                    name="Eligible, dominated"
                    data={points.filter(
                      (p) => p.enough && !p.benchmark && !frontierIds.has(p.id),
                    )}
                    fill="#56708f"
                    shape="circle"
                  />
                  <Scatter
                    name="Low coverage or geology unknown (U partial)"
                    data={points.filter((p) => !p.enough && !p.benchmark)}
                    fill="#080d18"
                    stroke="#e6b48c"
                    shape="circle"
                  />
                  <Scatter
                    name="Benchmark reference"
                    data={points.filter((p) => p.benchmark)}
                    fill="#111a29"
                    stroke="#C6D7E8"
                    shape="diamond"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="caption">
              Frontier ({frontier.length}):{" "}
              {frontier
                .sort((a, b) => b.F - a.F)
                .map((p) => p.name)
                .join(" · ") || "none"}
              . Hollow points use a partial U from less than{" "}
              {(100 * s.minCoverage).toFixed(0)}% of the weight and are excluded
              from the frontier. Benchmarks are shown for reference only.
            </p>
          </section>

          <section className="science-section">
            <div className="section-heading">
              <h2>How stable is this recommendation?</h2>
              <EvidenceTag kind="DERIVED" />
            </div>
            <p className="section-intro">
              <strong>Ranking stability under model assumptions.</strong>{" "}
              {stability.scenarios} deterministic scenarios perturb every
              criterion weight and similarity tolerance by up to ±
              {(100 * range).toFixed(0)}% (uniform, seeded) around the current
              settings, renormalizing weights. This measures weight/tolerance
              sensitivity only: it is not statistical confidence, not evidence
              completeness, not measurement uncertainty, and not a probability
              of mission success or of a correct planetary analogy.
            </p>
            <div className="robust-controls">
              <Range
                id="rb-range"
                label="Perturbation range"
                value={range}
                min={0.05}
                max={0.5}
                step={0.05}
                display={`±${(100 * range).toFixed(0)}%`}
                onChange={setRange}
              />
              <label className="lab-select" htmlFor="rb-seed">
                Seed
                <span className="seed-row">
                  <input
                    id="rb-seed"
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(Number(e.target.value) || 0)}
                  />
                  <button
                    className="button outline"
                    onClick={() => setSeed((x) => x + 1)}
                  >
                    <Shuffle size={13} /> Next seed
                  </button>
                </span>
              </label>
            </div>
            {stability.stats.length ? (
              <div
                className="robust-chart"
                role="table"
                aria-label="Rank intervals across scenarios"
              >
                <div className="rb-row rb-head" role="row">
                  <span>Candidate</span>
                  <span>Rank interval (best · IQR · worst, ● median)</span>
                  <span>Median</span>
                  <span>Ranked 1st</span>
                  <span>Top 3</span>
                </div>
                {stability.stats.map((st) => {
                  const x = (r: number) => `${((r - 0.5) / maxRank) * 100}%`;
                  return (
                    <div className="rb-row" role="row" key={st.id}>
                      <span className="rb-name">{st.name}</span>
                      <span className="rb-track">
                        <i
                          className="rb-line"
                          style={{
                            left: x(st.best),
                            width: `${((st.worst - st.best) / maxRank) * 100}%`,
                          }}
                        />
                        <i
                          className="rb-box"
                          style={{
                            left: x(st.q25),
                            width: `max(4px, ${((st.q75 - st.q25) / maxRank) * 100}%)`,
                          }}
                        />
                        <i className="rb-med" style={{ left: x(st.median) }} />
                      </span>
                      <span className="mono">{number(st.median, 1)}</span>
                      <span className="mono">
                        {(100 * st.firstShare).toFixed(0)}%
                      </span>
                      <span className="mono">
                        {(100 * st.top3Share).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
                <div className="rb-row rb-axis" aria-hidden="true">
                  <span />
                  <span className="rb-track">
                    {Array.from({ length: maxRank }, (_, i) => (
                      <em
                        key={i}
                        style={{ left: `${((i + 0.5) / maxRank) * 100}%` }}
                      >
                        {i + 1}
                      </em>
                    ))}
                  </span>
                </div>
              </div>
            ) : (
              <p className="empty-state">
                No evidence-eligible candidates to rank for this mission.
              </p>
            )}
            <p className="caption">
              Seed {stability.seed}, {stability.scenarios} scenarios, rank 1 =
              highest P.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
