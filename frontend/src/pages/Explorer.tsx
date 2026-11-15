import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleAlert,
  CircleX,
  Columns3,
  Database,
  Plus,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
  Compass,
  ListFilter,
  LocateFixed,
  FlaskConical,
  RotateCcw,
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
import { studyPath } from "../lib/collections";
import {
  comparisonIds,
  discoveryFilters,
  resetDiscoveryFilters,
} from "../lib/discoveryState";
import { ScoreStrip, SiteActions, Loading } from "../components/ui";
import { MarsGlyph, MoonGlyph } from "../components/glyphs";
import ModelControls from "../components/ModelControls";
import ResearchTrail from "../components/ResearchTrail";
const EarthMap = lazy(() => import("../components/EarthMap"));

const SELECTION_KEY = "terrainx-selection-v1";
const COMPARE_KEY = "terrainx-compare-v1";
const MAX_COMPARE = 3;

function CandidateRow({
  candidate,
  mission,
  selected,
  rank,
  onSelect,
  compared,
  compareFull,
  onCompare,
}: {
  candidate: Candidate;
  mission: Mission;
  selected: boolean;
  rank: string;
  onSelect: (id: string) => void;
  compared: boolean;
  compareFull: boolean;
  onCompare: (id: string) => void;
}) {
  const a = candidate.assessments[mission];
  return (
    <div className="candidate-item">
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
        {a.utility.evidence_label === "Insufficient evidence" ? (
          <small className="insufficient">
            <TriangleAlert size={11} />
            Required evidence missing · assessed weight (
            {number(100 * a.utility.coverage, 0)}% of weight assessed)
          </small>
        ) : null}
      </button>
      <button
        type="button"
        className={`compare-toggle ${compared ? "active" : ""}`}
        onClick={() => onCompare(candidate.id)}
        aria-pressed={compared}
        disabled={!compared && compareFull}
        title={
          compared
            ? "Remove from comparison"
            : compareFull
              ? `Up to ${MAX_COMPARE} candidates`
              : "Add to comparison"
        }
        aria-label={`${compared ? "Remove" : "Add"} ${candidate.name} ${compared ? "from" : "to"} comparison`}
      >
        {compared ? <Check size={12} /> : <Plus size={12} />}
        <span>Compare</span>
      </button>
    </div>
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
  const [filters, setFilters] = useState(() =>
    discoveryFilters(
      params,
      data.regions.map((r) => r.id),
    ),
  );
  const filterKey = params.toString();
  useLayoutEffect(
    () =>
      setFilters(
        discoveryFilters(
          new URLSearchParams(filterKey),
          data.regions.map((r) => r.id),
        ),
      ),
    [filterKey, data.regions],
  );
  const { region, sufficient, sortKey, query } = filters;
  function updateFilter(key: string, value: string) {
    setParams(
      () => {
        // Router query updates are not queued like React state. Read the latest
        // address so a fast filter change cannot undo a mission navigation.
        const p = new URLSearchParams(window.location.hash.split("?")[1]);
        value ? p.set(key, value) : p.delete(key);
        return p;
      },
      { replace: true },
    );
  }
  const setRegion = (value: string) => {
      setFilters((f) => ({ ...f, region: value }));
      updateFilter("atlas_region", value === "all" ? "" : value);
    },
    setSufficient = (value: boolean) => {
      setFilters((f) => ({ ...f, sufficient: value }));
      updateFilter("atlas_coverage", value ? "70" : "");
    },
    setSortKey = (value: SortKey) => {
      setFilters((f) => ({ ...f, sortKey: value }));
      updateFilter("atlas_sort", value);
    },
    setQuery = (value: string) => {
      setFilters((f) => ({ ...f, query: value }));
      updateFilter("atlas_q", value);
    };
  const [drawer, setDrawer] = useState(false),
    [focus, setFocus] = useState({ id: "", n: 0 });
  const [storedSelection] = useState<string>(() => {
    try {
      return JSON.parse(safeStorage.get(SELECTION_KEY) ?? "{}").id ?? "";
    } catch {
      return "";
    }
  });
  const listRef = useRef<HTMLDivElement>(null),
    navigate = useNavigate();
  const [storedCompare] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(safeStorage.get(COMPARE_KEY) ?? "[]");
      return Array.isArray(saved)
        ? saved
            .filter((x): x is string => typeof x === "string")
            .slice(0, MAX_COMPARE)
        : [];
    } catch {
      return [];
    }
  });
  const rawCompare = params.get("atlas_compare") ?? storedCompare.join(",");
  const compareIds = comparisonIds(
    rawCompare,
    data.candidates.map((c) => c.id),
    MAX_COMPARE,
  );
  const comparisonKey = compareIds.join(",");
  useEffect(() => {
    safeStorage.set(COMPARE_KEY, JSON.stringify(compareIds));
  }, [comparisonKey]);
  function toggleCompare(id: string) {
    const ids = compareIds.includes(id)
      ? compareIds.filter((x) => x !== id)
      : compareIds.length >= MAX_COMPARE
        ? compareIds
        : [...compareIds, id];
    updateFilter("atlas_compare", ids.join(",") || ",");
  }
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
  const characterized = discovered.filter(
      (c) => evidenceTier(c, mission) === 0,
    ),
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
  const requestedId = params.get("id") || params.get("atlas_id");
  const selectedId =
    requestedId ??
    (ordered.some((c) => c.id === storedSelection)
      ? storedSelection
      : ordered[0]?.id);
  const selected = ordered.find((c) => c.id === selectedId);
  const a = selected?.assessments[mission];
  const hasFilters = region !== "all" || sufficient || !!query;
  function jumpTo(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    element.setAttribute("tabindex", "-1");
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  useEffect(() => {
    if (selected)
      safeStorage.set(
        SELECTION_KEY,
        JSON.stringify({ id: selected.id, mission }),
      );
  }, [selected, mission]);
  function chooseMission(next: Mission) {
    const p = new URLSearchParams(window.location.hash.split("?")[1]);
    p.set("mission", next);
    if (next === "jezero") p.set("polar", "none");
    setParams(p);
  }
  function select(id: string, focusRow = false) {
    const p = new URLSearchParams(window.location.hash.split("?")[1]);
    p.set("id", id);
    p.set("atlas_id", id);
    setParams(p);
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
    if (event.key === "ArrowDown")
      next = Math.min(ordered.length - 1, index + 1);
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
      <ResearchTrail id={selected?.id} mission={mission} stage="discover" />
      <nav className="atlas-jump" aria-label="Discovery sections">
        <button onClick={() => jumpTo("earth-atlas")}>
          <Compass size={16} />
          Map
        </button>
        <button onClick={() => jumpTo("candidate-results")}>
          <ListFilter size={16} />
          Results <span className="mono">{ordered.length}</span>
        </button>
        <button
          onClick={() => jumpTo("selected-inspector")}
          disabled={!selected}
        >
          <LocateFixed size={16} />
          Selected site
        </button>
      </nav>
      <button
        className="mobile-mission button outline"
        onClick={() => setDrawer(!drawer)}
        aria-expanded={drawer}
        aria-controls="mission-settings"
      >
        <SlidersHorizontal size={17} />
        {target.body} · {target.name}
        <span className="mobile-mission-hint">Mission & filters</span>
        <ChevronDown size={16} />
      </button>
      <aside
        id="mission-settings"
        className={`mission-rail ${drawer ? "expanded" : ""}`}
      >
        <h1>Choose your mission</h1>
        <div
          className="planet-selector"
          role="group"
          aria-label="Planetary body"
        >
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
            <option value="mare-crisium">
              {data.targets.find((t) => t.id === "mare-crisium")?.name} · Moon
            </option>
          </select>
          <h3>Mission objective</h3>
          <p>{target.mission}</p>
          <details className="rail-more">
            <summary>Why this target matters</summary>
            <p className="rail-context">{target.context}</p>
          </details>
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
              {data.collection === "expanded"
                ? `${data.candidates.filter((c) => !c.benchmark).length} screened-cell profiles`
                : `${data.summary.shortlisted_candidates} algorithmic candidates`}
            </span>
          </div>
        </section>
        <details className="source-status source-details">
          <summary>
            <Database size={15} />
            Data availability
            <ChevronDown size={14} />
          </summary>
          {sources.map(([name, state, label]) => (
            <div key={name}>
              <span>{name}</span>
              <span className={`source-state state-${state}`}>
                <StatusIcon state={state} />
                {label}
              </span>
            </div>
          ))}
        </details>
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
      <aside
        className="results-rail"
        id="candidate-results"
        aria-label="Candidate results"
      >
        <div className="results-title">
          <h2>Earth experiment suitability</h2>
          <p>
            Sites with required evidence come first. Rankings describe this
            screened sample, with benchmarks kept separate.
          </p>
          <details className="score-key">
            <summary>How to read F · U · C</summary>
            <dl>
              <div>
                <dt>F · Terrain fidelity</dt>
                <dd>
                  Broad-scale morphology versus {target.name}; not rover-scale
                  hazards.
                </dd>
              </div>
              <div>
                <dt>U · Mission utility</dt>
                <dd>
                  Usefulness for an Earth experiment under the active model.
                  Missing criteria are excluded, not zero.
                </dd>
              </div>
              <div>
                <dt>C · Evidence coverage</dt>
                <dd>
                  Share of criterion weight assessed; not confidence or a
                  probability of success.
                </dd>
              </div>
              <div>
                <dt>P · Screening priority</dt>
                <dd>
                  Available only when fidelity, utility and required evidence
                  pass the model gates.
                </dd>
              </div>
            </dl>
          </details>
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
          <div
            className={`filter-summary ${hasFilters ? "is-filtered" : ""}`}
            role="status"
            aria-live="polite"
          >
            <span>
              <ListFilter size={13} />
              {ordered.length} sites shown{hasFilters ? " · filtered" : ""}
            </span>
            {hasFilters ? (
              <button
                onClick={() =>
                  setParams(resetDiscoveryFilters(params), { replace: true })
                }
              >
                <RotateCcw size={12} />
                Reset filters
              </button>
            ) : (
              <span className="filter-scope">
                {data.collection === "expanded"
                  ? "Expanded search"
                  : "Original study"}
              </span>
            )}
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
            {data.collection === "expanded"
              ? "Screened-cell profiles"
              : "Algorithmic shortlist"}{" "}
            <span>{discovered.length}</span>
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
              compared={compareIds.includes(c.id)}
              compareFull={compareIds.length >= MAX_COMPARE}
              onCompare={toggleCompare}
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
              compared={compareIds.includes(c.id)}
              compareFull={compareIds.length >= MAX_COMPARE}
              onCompare={toggleCompare}
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
              compared={compareIds.includes(c.id)}
              compareFull={compareIds.length >= MAX_COMPARE}
              onCompare={toggleCompare}
            />
          ))}
          <p className="list-end">
            Benchmarks are never counted as discoveries. Sorted by{" "}
            {sortLabels[sortKey]}.
          </p>
        </div>
        {rawCompare
          .split(",")
          .filter(Boolean)
          .some((id) => !data.candidates.some((c) => c.id === id)) && (
          <p className="warning-inline comparison-notice" role="status">
            Comparison picks outside this collection are excluded.{" "}
            <button
              className="link-button"
              onClick={() =>
                updateFilter("atlas_compare", comparisonKey || ",")
              }
            >
              Clear unavailable picks
            </button>
          </p>
        )}
        {compareIds.length ? (
          <div className="compare-tray" role="region" aria-label="Comparison">
            <div className="compare-tray-heading">
              <span>Compare up to {MAX_COMPARE} sites</span>
              <button onClick={() => updateFilter("atlas_compare", ",")}>
                Clear all
              </button>
            </div>
            <div className="compare-chips">
              {compareIds.map((id) => {
                const c = data.candidates.find((x) => x.id === id);
                return c ? (
                  <button
                    key={id}
                    onClick={() => toggleCompare(id)}
                    aria-label={`Remove ${c.name} from comparison`}
                  >
                    {ranks.get(id) ? (
                      <b className="mono">{ranks.get(id)}</b>
                    ) : null}
                    {c.name}
                    <X size={11} />
                  </button>
                ) : null;
              })}
            </div>
            <button
              className="button primary compare-open"
              disabled={compareIds.length < 2}
              onClick={() =>
                navigate(
                  studyPath(
                    `/compare?mission=${mission}&ids=${compareIds.join(",")}`,
                    params.toString(),
                  ),
                )
              }
            >
              <Columns3 size={15} />
              {compareIds.length < 2
                ? "Pick one more"
                : `Compare ${compareIds.length}`}
            </button>
          </div>
        ) : null}
        {!selected && requestedId && (
          <div className="selected-summary" role="status">
            <h2>
              {data.candidates.some((c) => c.id === requestedId)
                ? "Selected site is hidden by filters"
                : "Selected site is outside this collection"}
            </h2>
            <p>
              No other site was substituted.{" "}
              {data.candidates.some((c) => c.id === requestedId)
                ? "Clear the filters to return to it."
                : "Select an available candidate from the list."}
            </p>
            <button
              className="button outline"
              onClick={() =>
                setParams((current) => {
                  const p = resetDiscoveryFilters(current);
                  if (!data.candidates.some((c) => c.id === requestedId)) {
                    p.delete("id");
                    p.delete("atlas_id");
                  }
                  return p;
                })
              }
            >
              Reset filters and selection
            </button>
          </div>
        )}
        {selected && a ? (
          <div
            className={`selected-summary mission-${mission}`}
            id="selected-inspector"
          >
            <p className="inspector-label">
              <LocateFixed size={12} /> Selected Earth site
            </p>
            <div className="summary-head">
              <h2>{selected.name}</h2>
              <span className="rank-chip mono">{ranks.get(selected.id)}</span>
            </div>
            <p className="mono coordinate-line">{coordinates(selected)}</p>
            <ScoreStrip assessment={a} compact />
            <details className="selected-context">
              <summary>Geology & climate context</summary>
              <p className="evidence-rationale">
                {a.utility.criteria.geology.rationale}
              </p>
              <div className="summary-observation">
                <span>Annual precipitation proxy</span>
                <strong>
                  {number(selected.climate.annual_precip_mm, 0)}
                  <small>mm/year</small>
                </strong>
              </div>
            </details>
            {a.utility.evidence_label === "Insufficient evidence" ? (
              <p className="warning-inline">
                <TriangleAlert size={14} />
                Insufficient evidence for characterization.
              </p>
            ) : (
              <p className="warning-inline">
                Preliminary hypothesis only. Local verification required.
              </p>
            )}
            <SiteActions id={selected.id} mission={mission} />
            <Link
              className="field-next"
              to={studyPath(
                `/field-study?id=${selected.id}&atlas_id=${selected.id}&mission=${mission}`,
                params.toString(),
              )}
            >
              <FlaskConical size={15} />
              Plan a field experiment
              <ArrowUpRight size={14} />
            </Link>
            <p className="inspector-next">
              {data.target_reference
                ? "Polar mission utility is unassessed. Define the experiment and missing evidence first."
                : a.utility.criteria.geology.value == null
                  ? "Next: verify local geology before treating this as a geological analog."
                  : "Next: inspect the evidence, then write a testable field question."}
            </p>
          </div>
        ) : null}
      </aside>
    </main>
  );
}
