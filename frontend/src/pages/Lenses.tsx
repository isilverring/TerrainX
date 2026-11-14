import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Aperture, Info } from "lucide-react";
import { useData, number } from "../lib/data";
import { useModel } from "../lib/scoring";
import type { Mission } from "../lib/models";
import { LENSES, LENS_VERSION, agreement, lensRanking, type LensId } from "../lib/lenses";
import { BackLink } from "../components/ui";

const REGION_TINT: Record<string, string> = {
  saudi: "#3ec9b0",
  chile: "#ff8a65",
  gobi: "#f2c14e",
  botswana: "#7fb2ff",
};
const tint = (region: string) => REGION_TINT[region] ?? "#c6d7e8";
const fmt = (v: number | null) => (v == null ? "—" : number(v, 1));

/** Most frequent reason among unranked rows — shown when a lens can rank nobody. */
function commonReason(rows: { reason: string | null }[]) {
  const counts = new Map<string, number>();
  rows.forEach((r) => r.reason && counts.set(r.reason, (counts.get(r.reason) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export default function Lenses() {
  const data = useData(),
    model = useModel(),
    [params, setParams] = useSearchParams();
  const mission: Mission = params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const [focus, setFocus] = useState<string | null>(null),
    [pinned, setPinned] = useState<string | null>(null),
    [activeLens, setActiveLens] = useState<LensId>("baseline");
  const scenario = model.scenarios[mission];
  const rankings = useMemo(
    () => LENSES.map((l) => lensRanking(data.candidates, mission, l, scenario)),
    [data, mission, scenario],
  );
  const agree = useMemo(() => agreement(rankings), [rankings]);
  const byId = useMemo(() => new Map(data.candidates.map((c) => [c.id, c])), [data]);
  const n = rankings[0].length;
  const shown = pinned ?? focus;
  const lensIndex = LENSES.findIndex((l) => l.id === activeLens);

  // Chart geometry.
  const W = 1080,
    colGap = W / LENSES.length,
    top = 26,
    rowH = 26,
    bandY = top + n * rowH + 30,
    H = bandY + 44;
  const xOf = (i: number) => colGap * i + colGap / 2;
  const yOf = (rank: number | null) => (rank == null ? bandY : top + (rank - 1) * rowH + rowH / 2);
  // Spread unranked markers inside the band so they never overlap.
  const unrankedSlot = (lens: number, id: string) => {
    const list = rankings[lens].filter((r) => r.rank == null).map((r) => r.id);
    const k = list.indexOf(id),
      span = Math.min(colGap - 24, list.length * 11);
    return list.length <= 1 ? 0 : -span / 2 + (k * span) / (list.length - 1);
  };

  const story = shown ? agree.find((a) => a.id === shown) : null;
  const storyCandidate = shown ? byId.get(shown) : null;
  const sorted = rankings[lensIndex];

  return (
    <main className="document-page lenses-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">Discover · Discovery lenses</p>
          <h1>One shortlist, six questions.</h1>
          <p>
            The same {n} automatic candidates, re-ranked by declared lenses that ask different mission questions.
            Watch who holds their place, who rises, and who drops out — without touching the released model or its
            evidence.
          </p>
        </div>
        <div className="lens-mission" role="group" aria-label="Mission">
          {(["jezero", "mare-crisium"] as Mission[]).map((m) => (
            <button
              key={m}
              aria-pressed={m === mission}
              className={m === mission ? "active" : ""}
              onClick={() => {
                setParams({ mission: m });
                setPinned(null);
              }}
            >
              {m === "jezero" ? "Mars · Jezero" : "Moon · Mare Crisium"}
            </button>
          ))}
        </div>
      </header>

      <section className="lens-cards" aria-label="Lenses">
        {LENSES.map((l, i) => {
          const ranked = rankings[i].filter((r) => r.rank != null).length;
          return (
            <button
              key={l.id}
              className={`lens-card ${l.id === activeLens ? "active" : ""}`}
              aria-pressed={l.id === activeLens}
              onClick={() => setActiveLens(l.id)}
            >
              <span className="lens-index mono">{String(i + 1).padStart(2, "0")}</span>
              <strong>{l.name}</strong>
              <span className="lens-question">{l.question}</span>
              <span className="lens-ranked mono">
                {ranked}/{n} ranked
              </span>
            </button>
          );
        })}
      </section>

      <section className="lens-flow" aria-label="Rank flow across lenses">
        <div className="lens-chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="lens-chart" role="img" aria-labelledby="lens-chart-title">
            <title id="lens-chart-title">
              Rank of each candidate under each lens. Lines connect a candidate across lenses; the bottom band
              holds candidates a lens cannot rank.
            </title>
            {LENSES.map((l, i) => (
              <g key={l.id}>
                <rect
                  x={xOf(i) - colGap / 2 + 4}
                  y={0}
                  width={colGap - 8}
                  height={H}
                  rx={6}
                  className={`lens-col ${l.id === activeLens ? "active" : ""}`}
                  onClick={() => setActiveLens(l.id)}
                />
                <text x={xOf(i)} y={14} className="lens-col-label" textAnchor="middle">
                  {l.short}
                </text>
                {rankings[i].every((r) => r.rank == null) && (
                  <foreignObject x={xOf(i) - colGap / 2 + 14} y={top + rowH * 4} width={colGap - 28} height={rowH * 6}>
                    <p className="lens-empty">
                      <b>None ranked</b>
                      {commonReason(rankings[i])}
                    </p>
                  </foreignObject>
                )}
              </g>
            ))}
            {Array.from({ length: n }, (_, k) => (
              <text key={k} x={8} y={yOf(k + 1) + 4} className="lens-rank-label">
                {k + 1}
              </text>
            ))}
            <line x1={0} x2={W} y1={bandY - 18} y2={bandY - 18} className="lens-band-line" />
            <text x={8} y={bandY + 30} className="lens-rank-label">
              not ranked ↑
            </text>
            {agree.map((a) => {
              const c = byId.get(a.id)!,
                dim = shown && shown !== a.id,
                hot = shown === a.id;
              const pts = a.ranks.map((r, i) => ({
                x: xOf(i) + (r == null ? unrankedSlot(i, a.id) : 0),
                y: yOf(r),
                r,
              }));
              return (
                <g
                  key={a.id}
                  className={`lens-path ${dim ? "dim" : ""} ${hot ? "hot" : ""}`}
                  style={{ ["--tint" as string]: tint(c.region_id) }}
                  onMouseEnter={() => setFocus(a.id)}
                  onMouseLeave={() => setFocus(null)}
                  onClick={() => setPinned(pinned === a.id ? null : a.id)}
                >
                  {pts.slice(1).map((p, i) => {
                    const q = pts[i],
                      mx = (q.x + p.x) / 2;
                    return (
                      <path
                        key={i}
                        d={`M${q.x},${q.y} C${mx},${q.y} ${mx},${p.y} ${p.x},${p.y}`}
                        className={q.r == null || p.r == null ? "gap" : ""}
                      />
                    );
                  })}
                  {pts.map((p, i) =>
                    p.r == null ? (
                      <circle key={i} cx={p.x} cy={p.y} r={5} className="lens-unranked" />
                    ) : (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={9.5} className="lens-dot" />
                        <text x={p.x} y={p.y + 3.5} textAnchor="middle" className="lens-dot-label">
                          {p.r}
                        </text>
                      </g>
                    ),
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <aside className="lens-story" aria-live="polite">
          {story && storyCandidate ? (
            <>
              <p className="document-label" style={{ color: tint(storyCandidate.region_id) }}>
                {pinned ? "Pinned" : "Hovering"}
              </p>
              <h2>{storyCandidate.name}</h2>
              <p className="lens-verdict">
                {story.rankedIn === 0
                  ? "No lens can rank this candidate with the cached evidence."
                  : `Ranked by ${story.rankedIn} of ${LENSES.length} lenses · best #${story.best}, worst #${story.worst} · top-5 in ${story.topCount}.`}
              </p>
              <ul>
                {LENSES.map((l, i) => {
                  const row = rankings[i].find((r) => r.id === story.id)!;
                  return (
                    <li key={l.id}>
                      <span>{l.short}</span>
                      <b className="mono">{row.rank == null ? "—" : `#${row.rank}`}</b>
                      <small>{row.rank == null ? row.reason : `score ${fmt(row.value)}`}</small>
                    </li>
                  );
                })}
              </ul>
              <div className="source-row">
                <Link className="button outline" to={`/site/${story.id}?mission=${mission}`}>
                  Analog DNA
                </Link>
                <Link className="button outline" to={`/field-study?id=${story.id}&mission=${mission}`}>
                  Plan field study
                </Link>
              </div>
            </>
          ) : (
            <div className="lens-hint">
              <Aperture size={22} />
              <p>
                Hover a line to follow one candidate across lenses; click to pin it. Colours mark study regions:
              </p>
              <ul className="lens-legend">
                {data.regions.map((r) => (
                  <li key={r.id} style={{ ["--tint" as string]: tint(r.id) }}>
                    {r.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      <section className="science-section lens-detail">
        <h2>{LENSES[lensIndex].name}</h2>
        <p className="lens-eq mono">{LENSES[lensIndex].equation}</p>
        <p className="caption">
          <Info size={13} /> {LENSES[lensIndex].caveat}
        </p>
        <div className="table-scroll">
          <table className="lens-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate</th>
                <th>Score</th>
                <th>Inputs</th>
                <th>Agreement</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const c = byId.get(r.id)!,
                  a = agree.find((x) => x.id === r.id)!;
                return (
                  <tr
                    key={r.id}
                    className={shown === r.id ? "hot" : ""}
                    onMouseEnter={() => setFocus(r.id)}
                    onMouseLeave={() => setFocus(null)}
                  >
                    <td className="mono">{r.rank ?? "—"}</td>
                    <td>
                      <button
                        className="lens-name"
                        style={{ ["--tint" as string]: tint(c.region_id) }}
                        onClick={() => setPinned(pinned === r.id ? null : r.id)}
                        aria-pressed={pinned === r.id}
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="mono">{r.rank == null ? <em>{r.reason}</em> : fmt(r.value)}</td>
                    <td className="mono lens-inputs">
                      {Object.entries(r.inputs)
                        .map(([k, v]) => `${k} ${v == null ? "—" : k === "C" ? `${Math.round(v * 100)}%` : k === "missing" ? v : k === "terrain" || k === "aridity" ? v.toFixed(2) : number(v, 1)}`)
                        .join(" · ")}
                    </td>
                    <td>
                      <span className="lens-chips" aria-label={`Ranks across lenses: ${a.ranks.map((x) => x ?? "not ranked").join(", ")}`}>
                        {a.ranks.map((x, i) => (
                          <i key={i} className={x == null ? "none" : x <= 5 ? "top" : ""} title={`${LENSES[i].short}: ${x ?? "not ranked"}`}>
                            {x ?? "·"}
                          </i>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="science-section lens-rules">
        <h2>Rules every lens follows</h2>
        <ol>
          <li>Lenses are read-only views of the pinned release; the baseline ranking and cached evidence never change.</li>
          <li>Reference analogs are excluded from every lens ranking.</li>
          <li>A candidate a lens cannot score is listed as not ranked with its reason — never as zero.</li>
          <li>Missing geology is never rewarded: the evidence lens requires it and the pessimistic lens counts every missing criterion as 0.</li>
          <li>Ties break by candidate id, so every ranking is reproducible. Only “Your model” follows your What-if settings.</li>
          <li>Agreement is a count of rank positions across lenses — not a probability, and not a discovery winner.</li>
        </ol>
        <p>
          Lenses re-rank the 16 released candidates. To rank all 130 screened cells with real terrain and geology, open{" "}
          <Link to={`/cells?mission=${mission}`}>Search every cell</Link>.
        </p>
        <p className="caption mono">
          {LENS_VERSION} · {data.release?.release_id} · model {data.release?.model_version}
        </p>
      </section>
    </main>
  );
}
