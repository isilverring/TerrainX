import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Grid3x3, Info, Sparkles } from "lucide-react";
import { useData, number } from "../lib/data";
import type { Mission } from "../lib/models";
import { useScienceFile } from "../lib/scienceFile";
import { cellLabel, cellSearchSchema, type CellRow } from "../lib/cellSearch";
import ElevationGrid from "../components/ElevationGrid";
import { BackLink } from "../components/ui";

const MISSING = "The 130-cell search is not part of this historical science release. No newer data were substituted.";
const ramp = (t: number) => `hsl(${200 - 40 * t} ${40 + 30 * t}% ${20 + 38 * t}%)`;

function RegionPanel({
  region,
  rows,
  mission,
  releaseSet,
  shortlist,
  selected,
  onSelect,
  pRange,
}: {
  region: { id: string; name: string; bounds: number[] };
  rows: CellRow[];
  mission: Mission;
  releaseSet: Set<string>;
  shortlist: Set<string>;
  selected: string | null;
  onSelect: (id: string) => void;
  pRange: [number, number];
}) {
  const [w, s, e, n] = region.bounds,
    dLon = 0.625,
    dLat = 0.5,
    W = 280,
    sx = W / (e - w + dLon),
    H = (n - s + dLat) * sx * 1.15,
    sy = H / (n - s + dLat);
  return (
    <figure className="cell-panel">
      <figcaption>{region.name}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${region.name}: ${rows.length} screened cells`}>
        {rows.map((r) => {
          const m = r.missions[mission],
            x = (r.longitude - w) * sx,
            y = (n - r.latitude) * sy,
            t = m.P == null ? null : (m.P - pRange[0]) / Math.max(1e-9, pRange[1] - pRange[0]);
          return (
            <g
              key={r.id}
              className={`cell ${selected === r.id ? "sel" : ""}`}
              transform={`translate(${x},${y})`}
              onClick={() => onSelect(r.id)}
              onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && onSelect(r.id)}
              tabIndex={0}
              role="button"
              aria-pressed={selected === r.id}
              aria-label={`${cellLabel(r)}: ${m.P == null ? m.reason ?? "not ranked" : `rank ${m.rank}, P ${m.P.toFixed(1)}`}${shortlist.has(r.id) ? ", on the mission-aware shortlist" : ""}${releaseSet.has(r.id) ? ", on the released shortlist" : ""}`}
            >
              <rect
                width={dLon * sx - 3}
                height={dLat * sy - 3}
                rx={3}
                fill={t == null ? "url(#cell-hatch)" : ramp(t)}
                className="cell-fill"
              />
              {releaseSet.has(r.id) && <rect width={dLon * sx - 3} height={dLat * sy - 3} rx={3} className="cell-release" />}
              {shortlist.has(r.id) && (
                <circle cx={(dLon * sx - 3) / 2} cy={(dLat * sy - 3) / 2} r={5} className="cell-star" />
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export default function CellSearch() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const mission: Mission = params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const { value: search, error } = useScienceFile("cell_search.json", cellSearchSchema, MISSING);
  const [selected, setSelected] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!search) return null;
    const m = search.missions[mission],
      ranked = search.rows.filter((r) => r.missions[mission].rank != null).sort((a, b) => a.missions[mission].rank! - b.missions[mission].rank!),
      ps = ranked.map((r) => r.missions[mission].P!);
    return {
      m,
      ranked,
      pRange: (ps.length ? [Math.min(...ps), Math.max(...ps)] : [0, 1]) as [number, number],
      releaseSet: new Set(search.released_shortlist),
      shortlist: new Set(m.shortlist),
    };
  }, [search, mission]);

  if (error) return <main className="document-page"><BackLink mission={mission} /><p role="alert">{error}</p></main>;
  if (!search || !view) return <main className="document-page"><p>Loading the 130-cell search…</p></main>;

  const pick = search.rows.find((r) => r.id === selected) ?? (view.ranked[0] ?? search.rows[0]);
  const pm = pick.missions[mission];
  const moonFind = search.rows.filter((r) => r.missions["mare-crisium"].rank != null);

  return (
    <main className="document-page cells-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">Discover · Search every cell</p>
          <h1>What if we had searched for the mission, not just dryness?</h1>
          <p>
            The released shortlist ranked {search.cells} NASA POWER cells by aridity alone. Here every cell gets real SRTM terrain
            and Macrostrat geology, then the same mission model ranks them. A separate, versioned experiment: the released
            discovery is unchanged.
          </p>
        </div>
        <div className="lens-mission" role="group" aria-label="Mission">
          {(["jezero", "mare-crisium"] as Mission[]).map((mm) => (
            <button key={mm} aria-pressed={mm === mission} className={mm === mission ? "active" : ""} onClick={() => { setParams({ mission: mm }); setSelected(null); }}>
              {mm === "jezero" ? "Mars · Jezero" : "Moon · Mare Crisium"}
            </button>
          ))}
        </div>
      </header>

      <section className="cell-funnel" aria-label="Search funnel">
        {[
          [search.cells, "screened cells"],
          [search.terrain_available, "with real SRTM terrain"],
          [search.geology_mapped, "with mapped geology"],
          [view.m.eligible, "rankable for this mission"],
          [view.m.shortlist.length, "mission-aware shortlist"],
        ].map(([v, l], i) => (
          <div key={i} style={{ ["--w" as string]: `${(Number(v) / search.cells) * 100}%` }}>
            <b className="mono">{v}</b>
            <span>{l}</span>
            <i aria-hidden="true" />
          </div>
        ))}
      </section>

      {mission === "mare-crisium" && moonFind.length > 0 && (
        <section className="cell-callout">
          <Sparkles size={20} />
          <div>
            <h2>The first lunar-eligible cell</h2>
            <p>
              The aridity-only search ranked no Earth candidate for Mare Crisium, because no basalt was mapped at any of them. Searching
              all cells finds {moonFind.length === 1 ? "one" : moonFind.length}:{" "}
              {moonFind.map((r) => (
                <button key={r.id} className="link-button" onClick={() => setSelected(r.id)}>
                  {cellLabel(r)} — “{r.geology.unit_name}” (P {number(r.missions["mare-crisium"].P, 1)}, F {number(r.missions["mare-crisium"].F, 1)})
                </button>
              ))}
              . A mapped regional unit, not confirmed basalt at a subsite: the next step is field verification.
            </p>
          </div>
        </section>
      )}

      <section className="cell-workbench">
        <div className="cell-panels">
          <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
            <defs>
              <pattern id="cell-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#111a29" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="#2a3a52" strokeWidth="2" />
              </pattern>
            </defs>
          </svg>
          {data.regions.map((region) => (
            <RegionPanel
              key={region.id}
              region={region}
              rows={search.rows.filter((r) => r.region_id === region.id)}
              mission={mission}
              releaseSet={view.releaseSet}
              shortlist={view.shortlist}
              selected={pick.id}
              onSelect={setSelected}
              pRange={view.pRange}
            />
          ))}
          <div className="cell-legend">
            <span><i className="lg-ramp" /> P {number(view.pRange[0], 0)}–{number(view.pRange[1], 0)}</span>
            <span><i className="lg-hatch" /> not rankable</span>
            <span><i className="lg-release" /> released (aridity) shortlist</span>
            <span><i className="lg-star" /> mission-aware shortlist</span>
          </div>
        </div>
        <aside className="cell-detail" aria-live="polite">
          <p className="document-label">{pick.released_candidate ? "Released candidate" : "Screened cell"} · {pick.region_id}</p>
          <h2>{cellLabel(pick)}</h2>
          {pick.terrain.elevations_m && <ElevationGrid z={pick.terrain.elevations_m} label={cellLabel(pick)} size={126} />}
          <dl className="cell-scores">
            {(["F", "U", "C", "P"] as const).map((k) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd className="mono">{k === "C" ? `${Math.round(pm.C * 100)}%` : number(pm[k], 1)}</dd>
              </div>
            ))}
          </dl>
          <p className="cell-rank">{pm.rank ? `Rank ${pm.rank} of ${view.m.eligible} for this mission` : pm.reason}</p>
          <p><strong>{pick.geology.unit_name ?? (pick.geology.lith ? "Mapped unit (unnamed)" : "No mapped unit")}</strong>{pick.geology.lith ? ` · ${pick.geology.lith}` : ""}{pick.geology.age ? ` · ${pick.geology.age}` : ""}</p>
          <p className="caption">{pm.geology_rationale}</p>
          {pick.terrain.metrics && (
            <p className="mono cell-metrics">
              slope med {number(pick.terrain.metrics.median_slope_deg, 1)}° · p90 {number(pick.terrain.metrics.p90_slope_deg, 1)}° · relief {number(pick.terrain.metrics.relief_m, 0)} m
            </p>
          )}
          <p className="caption">
            {pick.geology.source_refs[0] && <a href={pick.geology.source_refs[0]} target="_blank" rel="noreferrer">Macrostrat query</a>} · aridity {number(pick.aridity, 2)} · annual precipitation {number(pick.annual_precip_mm, 0)} mm
          </p>
          {pick.released_candidate && (
            <Link className="button outline" to={`/site/${pick.id}?mission=${mission}`}>Analog DNA</Link>
          )}
        </aside>
      </section>

      <section className="science-section cell-compare">
        <h2><Grid3x3 size={22} /> Two shortlists, same rules</h2>
        <p>
          Both use 4 cells per region and 65 km separation. The released list sorts by aridity; the mission-aware list sorts by combined
          priority P. {view.m.overlap_with_release.length} of {view.m.shortlist.length} mission-aware picks were already on the released list.
        </p>
        <div className="cell-two">
          {[
            ["Released · aridity first", search.released_shortlist],
            ["Mission-aware · P first", view.m.shortlist],
          ].map(([title, ids]) => (
            <div key={title as string}>
              <h3>{title as string}</h3>
              <ol>
                {(ids as string[]).map((id) => {
                  const r = search.rows.find((x) => x.id === id)!,
                    both = view.releaseSet.has(id) && view.shortlist.has(id);
                  return (
                    <li key={id} className={both ? "both" : ""}>
                      <button className="link-button" onClick={() => setSelected(id)}>{r.region_id} · {cellLabel(r)}</button>
                      <span className="mono">{r.missions[mission].P == null ? "—" : `P ${r.missions[mission].P!.toFixed(1)}`}</span>
                    </li>
                  );
                })}
                {(ids as string[]).length === 0 && <li className="caption">No cell is rankable.</li>}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="science-section">
        <h2>Top rankable cells</h2>
        <div className="table-scroll">
          <table className="lens-table">
            <thead><tr><th>Rank</th><th>Cell</th><th>P</th><th>F</th><th>U</th><th>Mapped unit</th><th>Lists</th></tr></thead>
            <tbody>
              {view.ranked.slice(0, 20).map((r) => {
                const m = r.missions[mission];
                return (
                  <tr key={r.id} className={pick.id === r.id ? "hot" : ""}>
                    <td className="mono">{m.rank}</td>
                    <td><button className="link-button" onClick={() => setSelected(r.id)}>{r.region_id} · {cellLabel(r)}</button></td>
                    <td className="mono">{number(m.P, 1)}</td>
                    <td className="mono">{number(m.F, 1)}</td>
                    <td className="mono">{number(m.U, 1)}</td>
                    <td>{r.geology.unit_name ?? r.geology.lith ?? "—"}</td>
                    <td>{view.shortlist.has(r.id) ? "mission " : ""}{view.releaseSet.has(r.id) ? "released" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="science-section lens-rules">
        <h2>How this experiment differs</h2>
        <ol>
          <li>Every cell uses the pipeline's own SRTM sampler, terrain metrics, Macrostrat classifier, utility, fidelity and priority functions; F reproduces every released candidate exactly.</li>
          <li>Point temperature climatology was not acquired for cells, so the temperature criterion is missing for all {search.cells} (coverage ≤ 95%) — applied equally, never counted as zero.</li>
          <li>Missing or unmatched geology is never rewarded: such cells are listed as not rankable.</li>
          <li>Raw responses were fetched by a browser and re-hashed on import; {search.provenance.length} cached sources carry SHA-256 hashes.</li>
          <li>Mapped regional units are not field-confirmed lithology. Every pick is a hypothesis for verification.</li>
        </ol>
        <p className="caption mono"><Info size={12} /> {search.contract} · {data.release?.release_id}</p>
      </section>
    </main>
  );
}
