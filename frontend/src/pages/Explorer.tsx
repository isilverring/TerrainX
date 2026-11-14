import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  CircleX,
  Database,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import {
  useData,
  rankCandidates,
  number,
  coordinates,
  statusName,
  safeStorage,
  sortLabels,
  evidenceTier,
} from "../lib/data";
import type { SortKey } from "../lib/data";
import type { Candidate, Mission } from "../lib/models";
import { ScoreStrip, SiteActions, Loading } from "../components/ui";
import { MarsGlyph, MoonGlyph } from "../components/glyphs";
import ModelControls from "../components/ModelControls";
const EarthMap = lazy(() => import("../components/EarthMap"));

const SELECTION_KEY = "terrainx-selection-v1";

function CandidateRow({
  candidate,
  mission,
  selected,
  rank,
  onSelect,
}: {
  candidate: Candidate;
  mission: Mission;
  selected: boolean;
  rank: string;
  onSelect: (id: string) => void;
}) {
  const a = candidate.assessments[mission];
  return (
    <button
      className={`candidate-row ${selected ? "selected" : ""}`}
      onClick={() => onSelect(candidate.id)}
      aria-pressed={selected}
      data-candidate-id={candidate.id}
      tabIndex={selected ? 0 : -1}
    >
      <div className="candidate-name">
        <span className="rank-chip mono" aria-label={`Rank ${rank}`}>
          {rank}
        </span>
        <span className="candidate-name-text">
          <strong>{candidate.name}</strong>
          <span
            className={`status-label ${candidate.benchmark ? "benchmark" : ""} ${a.utility.status === "SCREENED CANDIDATE" ? "screened" : ""}`}
          >
            {statusName(a.utility.status)}
          </span>
        </span>
      </div>
      <ScoreStrip assessment={a} compact />
      {a.utility.coverage < 0.7 ? (
        <small className="insufficient">
          <TriangleAlert size={11} />
          Insufficient evidence · U is partial (
          {number(100 * a.utility.coverage, 0)}% of weight assessed)
        </small>
      ) : null}
    </button>
  );
}

type SourceState = "ok" | "partial" | "missing";
function sourceState(count: number, total: number): SourceState {
  return count <= 0 ? "missing" : count < total ? "partial" : "ok";
}
function StatusIcon({ state }: { state: SourceState }) {
  if (state === "ok") return <Check size={12} aria-label="Available" />;
  if (state === "partial")
    return <CircleAlert size={12} aria-label="Partially available" />;
  return <CircleX size={12} aria-label="Unavailable" />;
}

export default function Explorer() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const mission: Mission =
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const [region, setRegion] = useState("all"),
    [sufficient, setSufficient] = useState(false),
    [drawer, setDrawer] = useState(false),
    [sortKey, setSortKey] = useState<SortKey>("U"),
    [query, setQuery] = useState(""),
    [focus, setFocus] = useState({ id: "", n: 0 });
  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return JSON.parse(safeStorage.get(SELECTION_KEY) ?? "{}").id ?? "";
    } catch {
      return "";
    }
  });
  const listRef = useRef<HTMLDivElement>(null);
  const target = data.targets.find((t) => t.id === mission)!;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.candidates.filter(
      (c) =>
        (region === "all" || c.region_id === region || c.benchmark) &&
        (!sufficient || c.assessments[mission].utility.coverage >= 0.7) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          statusName(c.assessments[mission].utility.status).includes(q)),
    );
  }, [data, region, mission, sufficient, query]);
  const discovered = useMemo(
    () =>
      rankCandidates(
        filtered.filter((c) => !c.benchmark),
        mission,
        sortKey,
      ),
    [filtered, mission, sortKey],
  );
  const references = useMemo(
    () =>
      rankCandidates(
        filtered.filter((c) => c.benchmark),
        mission,
        sortKey,
        false,
      ),
    [filtered, mission, sortKey],
  );
  const characterized = discovered.filter((c) => evidenceTier(c, mission) === 0),
    screened = discovered.filter((c) => evidenceTier(c, mission) !== 0);
  const ordered = useMemo(
    () => [...discovered, ...references],
    [discovered, references],
  );
  const ranks = useMemo(() => {
    const m = new Map<string, string>();
    discovered.forEach((c, i) => m.set(c.id, String(i + 1)));
    references.forEach((c, i) => m.set(c.id, `R${i + 1}`));
    return m;
  }, [discovered, references]);
  const selected = ordered.find((c) => c.id === selectedId) ?? ordered[0];
  const a = selected?.assessments[mission];
  useEffect(() => {
    if (selected)
      safeStorage.set(
        SELECTION_KEY,
        JSON.stringify({ id: selected.id, mission }),
      );
  }, [selected, mission]);
  function chooseMission(next: Mission) {
    setParams({ mission: next });
  }
  function select(id: string, focusRow = false) {
    setSelectedId(id);
    setFocus((f) => ({ id, n: f.n + 1 }));
    const row = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-candidate-id="${CSS.escape(id)}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
    if (focusRow) row?.focus({ preventScroll: true });
  }
  function onListKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!ordered.length) return;
    const index = Math.max(
      0,
      ordered.findIndex((c) => c.id === selected?.id),
    );
    let next = index;
    if (event.key === "ArrowDown") next = Math.min(ordered.length - 1, index + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ordered.length - 1;
    else return;
    event.preventDefault();
    select(ordered[next].id, true);
  }
  const climateState = sourceState(
      data.summary.climate_profiles,
      data.candidates.length,
    ),
    terrainState = sourceState(
      data.summary.terrain_profiles,
      data.candidates.length,
    ),
    geologyState = sourceState(
      data.summary.geology_mapped,
      data.candidates.length,
    ),
    demState: SourceState =
      target.terrain.status === "available" ? "ok" : "missing";
  const sources: [string, SourceState, string][] = [
    ["NASA POWER", climateState, `${data.summary.climate_profiles} profiles`],
    ["SRTM", terrainState, `${data.summary.terrain_profiles} profiles`],
    [
      mission === "jezero" ? "MOLA" : "LOLA",
      demState,
      demState === "ok" ? "Real DEM" : "Not assessed",
    ],
    [
      "Macrostrat",
      geologyState,
      `${data.summary.geology_mapped}/${data.candidates.length} mapped`,
    ],
  ];
  return (
    <main className="explorer">
      <button
        className="mobile-mission button outline"
        onClick={() => setDrawer(!drawer)}
        aria-expanded={drawer}
      >
        <SlidersHorizontal size={17} />
        {mission === "jezero" ? "Mars · Jezero" : "Moon · Mare Crisium"}
        <span className="mobile-mission-hint">Mission & filters</span>
        <ChevronDown size={16} />
      </button>
      <aside className={`mission-rail ${drawer ? "expanded" : ""}`}>
        <h1>Choose your mission</h1>
        <div className="planet-selector" role="group" aria-label="Planetary body">
          <button
            className={mission === "jezero" ? "active mars" : ""}
            onClick={() => chooseMission("jezero")}
            aria-pressed={mission === "jezero"}
          >
            <MarsGlyph size={20} />
            Mars
          </button>
          <button
            className={mission === "mare-crisium" ? "active moon" : ""}
            onClick={() => chooseMission("mare-crisium")}
            aria-pressed={mission === "mare-crisium"}
          >
            <MoonGlyph size={20} />
            Moon
          </button>
        </div>
        <section>
          <label htmlFor="target">Target</label>
          <select
            id="target"
            value={mission}
            onChange={(e) => chooseMission(e.target.value as Mission)}
          >
            <option value="jezero">Jezero Crater · Mars</option>
            <option value="mare-crisium">Mare Crisium · Moon</option>
          </select>
          <h3>Mission objective</h3>
          <p>{target.mission}</p>
          <p className="rail-context">{target.context}</p>
        </section>
        <section>
          <label htmlFor="region">Study region</label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">All four study regions</option>
            {data.regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <label className="check-label">
            <input
              type="checkbox"
              checked={sufficient}
              onChange={(e) => setSufficient(e.target.checked)}
            />
            Coverage ≥70% only
          </label>
          <div className="search-count">
            <strong>{data.summary.screened_cells}</strong>
            <span>
              real cells screened
              <br />
              {data.summary.shortlisted_candidates} algorithmic candidates
            </span>
          </div>
        </section>
        <section className="source-status">
          <h3>
            <Database size={15} />
            Source status
          </h3>
          {sources.map(([name, state, label]) => (
            <div key={name}>
              <span>{name}</span>
              <span className={`source-state state-${state}`}>
                <StatusIcon state={state} />
                {label}
              </span>
            </div>
          ))}
        </section>
        <ModelControls mission={mission} />
        <Link className="method-link" to="/methodology">
          Explore the methodology
          <ArrowUpRight size={15} />
        </Link>
        <small className="rail-disclaimer">
          Independent research prototype.
          <br />
          No NASA approval or field verification.
        </small>
      </aside>
      <Suspense fallback={<Loading message="Opening the Earth atlas…" />}>
        <EarthMap
          candidates={filtered}
          selected={selected}
          focus={focus}
          onSelect={(id) => select(id)}
          mission={mission}
          ranks={ranks}
          regions={data.regions}
          region={region}
          onRegion={setRegion}
        />
      </Suspense>
      <aside className="results-rail">
        <div className="results-title">
          <h2>Earth experiment suitability</h2>
          <p>
            Characterized candidates are listed before screened ones, so a
            partial U never outranks a fully assessed one. F, U and C stay
            separate.
          </p>
          <div className="results-tools">
            <label className="search-box">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search candidates"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search candidates by name or status"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              ) : null}
            </label>
            <div className="sort-control" role="group" aria-label="Sort by">
              {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                <button
                  key={key}
                  className={sortKey === key ? "active" : ""}
                  onClick={() => setSortKey(key)}
                  aria-pressed={sortKey === key}
                  title={`Sort by ${sortLabels[key]}${key === "F" || key === "P" ? " (not assessed values sort last)" : ""}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          className="candidate-scroll"
          ref={listRef}
          onKeyDown={onListKey}
          role="region"
          aria-label="Ranked candidates. Use the up and down arrow keys to move through the list."
        >
          <h3 className="list-heading">
            Algorithmic shortlist <span>{discovered.length}</span>
          </h3>
          {characterized.length ? (
            <h4 className="tier-heading tier-characterized">
              Characterized · preliminary hypothesis
              <span>{characterized.length}</span>
            </h4>
          ) : null}
          {characterized.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              mission={mission}
              rank={ranks.get(c.id) ?? ""}
              selected={selected?.id === c.id}
              onSelect={select}
            />
          ))}
          {screened.length ? (
            <h4 className="tier-heading tier-screened">
              Screened · needs more evidence
              <span>{screened.length}</span>
            </h4>
          ) : null}
          {screened.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              mission={mission}
              rank={ranks.get(c.id) ?? ""}
              selected={selected?.id === c.id}
              onSelect={select}
            />
          ))}
          {!discovered.length ? (
            <p className="empty-state">
              {query
                ? `No algorithmic candidates match “${query}”.`
                : "No candidates meet this evidence filter for the selected mission."}
            </p>
          ) : null}
          <h3 className="list-heading reference-heading">
            Known benchmark references <span>{references.length}</span>
          </h3>
          {references.map((c) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              mission={mission}
              rank={ranks.get(c.id) ?? ""}
              selected={selected?.id === c.id}
              onSelect={select}
            />
          ))}
          <p className="list-end">
            Benchmarks are never counted as discoveries. Sorted by{" "}
            {sortLabels[sortKey]}.
          </p>
        </div>
        {selected && a ? (
          <div className="selected-summary">
            <div className="summary-head">
              <h2>{selected.name}</h2>
              <span className="rank-chip mono">{ranks.get(selected.id)}</span>
            </div>
            <p className="mono coordinate-line">{coordinates(selected)}</p>
            <ScoreStrip assessment={a} compact />
            <p className="evidence-rationale">
              {a.utility.criteria.geology.rationale}
            </p>
            {a.utility.coverage < 0.7 ? (
              <p className="warning-inline">
                <TriangleAlert size={14} />
                Insufficient evidence for characterization.
              </p>
            ) : (
              <p className="warning-inline">
                Preliminary hypothesis only. Local verification required.
              </p>
            )}
            <div className="summary-observation">
              <span>Annual precipitation proxy</span>
              <strong>
                {number(selected.climate.annual_precip_mm, 0)}
                <small>mm/year</small>
              </strong>
            </div>
            <SiteActions id={selected.id} mission={mission} />
          </div>
        ) : null}
      </aside>
    </main>
  );
}
