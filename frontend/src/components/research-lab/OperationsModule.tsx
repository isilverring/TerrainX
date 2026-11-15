import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { number } from "../../lib/data";
import {
  routeCoordinates,
  terrainRoute,
  type OperationsProfile,
} from "../../lib/researchLab";
import { download } from "../../lib/packet";
import {
  calculate,
  InputError,
  Metric,
  Numeric,
  Outcome,
  Panel,
  type SiteContext,
} from "./Shared";

export default function Operations({
  candidate,
  mission,
  onCandidate,
  profiles,
  error,
}: { profiles?: OperationsProfile[]; error?: string } & SiteContext) {
  const fine = profiles?.find((p) => p.id === candidate.id);
  const grid = useMemo(
    () =>
      fine?.elevations_m ??
      candidate.terrain.elevations_m?.slice().reverse() ??
      [],
    [fine, candidate.terrain.elevations_m],
  );
  const n = grid.length,
    spacing =
      fine?.sample_spacing_m ?? candidate.terrain.sample_spacing_m ?? 4000;
  const [start, setStart] = useState(0),
    [end, setEnd] = useState(0),
    [mode, setMode] = useState<"start" | "end">("start"),
    [cursor, setCursor] = useState(0),
    [limit, setLimit] = useState<number | null>(15),
    [penalty, setPenalty] = useState<number | null>(3);
  useEffect(() => {
    setStart(Math.floor(n / 2) * n);
    setEnd(Math.floor(n / 2) * n + n - 1);
    setCursor(Math.floor(n / 2) * n);
  }, [candidate.id, n]);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context || !n) return;
    const valid = grid
      .flat()
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const min = Math.min(...valid),
      span = Math.max(...valid) - min || 1;
    const image = context.createImageData(n, n);
    grid.flat().forEach((z, i) => {
      const t = z === null ? 0 : (z - min) / span;
      image.data[i * 4] = z === null ? 10 : 28 + 95 * t;
      image.data[i * 4 + 1] = z === null ? 16 : 47 + 115 * t;
      image.data[i * 4 + 2] = z === null ? 26 : 60 + 120 * t;
      image.data[i * 4 + 3] = 255;
    });
    context.putImageData(image, 0, 0);
  }, [grid, n]);
  const result = useMemo(
    () =>
      calculate(() => {
        if (limit === null || penalty === null) return null;
        return terrainRoute(grid, spacing, start, end, limit, penalty);
      }),
    [grid, spacing, start, end, limit, penalty],
  );
  const route = result.value;
  function choose(index: number) {
    if (mode === "start") {
      setStart(index);
      setMode("end");
    } else setEnd(index);
    setCursor(index);
  }
  function keydown(e: KeyboardEvent<HTMLCanvasElement>) {
    let next = cursor;
    const r = Math.floor(cursor / n),
      c = cursor % n;
    if (e.key === "ArrowRight") next = r * n + Math.min(n - 1, c + 1);
    else if (e.key === "ArrowLeft") next = r * n + Math.max(0, c - 1);
    else if (e.key === "ArrowUp") next = Math.max(0, r - 1) * n + c;
    else if (e.key === "ArrowDown") next = Math.min(n - 1, r + 1) * n + c;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(cursor);
      return;
    } else return;
    e.preventDefault();
    setCursor(next);
  }
  const location = (i: number) => {
    const row = Math.floor(i / n),
      col = i % n;
    if (fine)
      return routeCoordinates(
        candidate.latitude,
        candidate.longitude,
        row,
        col,
        n,
        spacing,
      );
    return [
      candidate.longitude +
        ((((col - (n - 1) / 2) * spacing) /
          6371000 /
          Math.cos((candidate.latitude * Math.PI) / 180)) *
          180) /
          Math.PI,
      candidate.latitude +
        (((((n - 1) / 2 - row) * spacing) / 6371000) * 180) / Math.PI,
    ];
  };
  const sources =
    fine?.sources.map((s) => s.url) ??
    candidate.terrain.provenance?.map((p) => p.source_url) ?? [];
  const geojson =
    route?.status === "available" && route.path.length >= 2
      ? {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: route.path.map(location),
              },
              properties: {
                candidate_id: candidate.id,
                sample_spacing_m: spacing,
                edge_slope_limit_deg: limit,
                slope_cost: penalty,
                source_urls: sources,
                source_kind: fine
                  ? "Copernicus DSM"
                  : "NASA SRTM coarse fallback",
                ...route,
                path: undefined,
              },
            },
          ],
        }
      : null;
  const point = (i: number) =>
    `${(((i % n) + 0.5) / n) * 100},${((Math.floor(i / n) + 0.5) / n) * 100}`;
  return (
    <>
      <Panel
        title="Screen a route on measured terrain"
        eyebrow="Mission operations · proposed graph paths"
      >
        <p>
          Compare route alternatives under explicit edge-slope and distance
          costs. This exposes where terrain refinement is needed; it does not
          establish traversability or landing safety.
        </p>
        <label className="lab-input">
          Optional250m Copernicus study profile
          <select
            value={fine?.id ?? ""}
            onChange={(e) => {
              if (e.target.value) onCandidate(e.target.value);
            }}
          >
            <option value="">
              {fine
                ? "Select a verified profile"
                : "This site uses its real coarse SRTM fallback"}
            </option>
            {profiles?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="status">
            {error} No substitute higher-resolution raster was used.
          </p>
        )}
        <div className="lab-metrics">
          <Metric
            label="Source"
            value={fine ? "Copernicus DSM" : "SRTM"}
            hint={
              fine
                ? "Native3arcseconds;250m analysis samples"
                : "Coarse4km samples; broad route context only"
            }
          />
          <Metric
            label="Analysis lattice"
            value={`${n}×${n}`}
            hint="North up; actual source elevations"
          />
          <Metric
            label="Sample spacing"
            value={number(spacing, 0)}
            unit="m"
            hint="Graph edge baselines: one spacing or √2 spacings"
          />
        </div>
        {!fine && (
          <p className="scientific-caveat">
            No250m refinement exists for this selected site. Its actual7×7 SRTM
            lattice is shown with its own4km baseline. It cannot resolve local
            routes or obstacles.
          </p>
        )}
      </Panel>
      <div className="lab-two lab-route-layout">
        <Panel title="Inspect and select route nodes">
          <div
            className="segmented"
            role="group"
            aria-label="Route node placement"
          >
            <button
              aria-pressed={mode === "start"}
              className={mode === "start" ? "active" : ""}
              onClick={() => setMode("start")}
            >
              Set start
            </button>
            <button
              aria-pressed={mode === "end"}
              className={mode === "end" ? "active" : ""}
              onClick={() => setMode("end")}
            >
              Set destination
            </button>
          </div>
          <div className="lab-route-map">
            <canvas
              ref={canvas}
              width={n || 1}
              height={n || 1}
              tabIndex={0}
              aria-label="Measured terrain route grid. Arrow keys move the cursor; Enter places the selected start or destination."
              onKeyDown={keydown}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = Math.min(
                    n - 1,
                    Math.max(
                      0,
                      Math.floor(((e.clientX - r.left) / r.width) * n),
                    ),
                  ),
                  y = Math.min(
                    n - 1,
                    Math.max(
                      0,
                      Math.floor(((e.clientY - r.top) / r.height) * n),
                    ),
                  );
                choose(y * n + x);
              }}
            />
            <svg viewBox="0 0 100 100" aria-hidden="true">
              {route?.status === "available" && (
                <polyline
                  points={route.path.map(point).join(" ")}
                  fill="none"
                  stroke="#35c3b0"
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
              )}
              <circle
                cx={(((start % n) + 0.5) / n) * 100}
                cy={((Math.floor(start / n) + 0.5) / n) * 100}
                r={1.5}
                fill="#35c3b0"
                stroke="#080d18"
                strokeWidth={0.5}
              />
              <circle
                cx={(((end % n) + 0.5) / n) * 100}
                cy={((Math.floor(end / n) + 0.5) / n) * 100}
                r={1.5}
                fill="#f17e5a"
                stroke="#080d18"
                strokeWidth={0.5}
              />
              <rect
                x={((cursor % n) / n) * 100}
                y={(Math.floor(cursor / n) / n) * 100}
                width={100 / n}
                height={100 / n}
                fill="none"
                stroke="#f2f5fa"
                strokeWidth={0.4}
              />
            </svg>
          </div>
          <p className="caption" aria-live="polite">
            Cursor row {Math.floor(cursor / n)}, column {cursor % n} · elevation{" "}
            {number(grid[Math.floor(cursor / n)]?.[cursor % n], 1)}m. Dark
            missing/water nodes cannot route. Start is cyan; destination copper.
          </p>
          <p className="caption">
            Real{fine ? "Copernicus" : "SRTM"} heights; pixelated analysis
            lattice. No generated terrain, vertical exaggeration or invented
            hazard layer.
          </p>
        </Panel>
        <Panel title="Declare the route experiment">
          <div className="lab-input-grid">
            <Numeric
              label="Start row"
              value={Math.floor(start / n)}
              onChange={(v) => setStart((v ?? -1) * n + (start % n))}
              min={0}
              max={n - 1}
            />
            <Numeric
              label="Start column"
              value={start % n}
              onChange={(v) => setStart(Math.floor(start / n) * n + (v ?? -1))}
              min={0}
              max={n - 1}
            />
            <Numeric
              label="Destination row"
              value={Math.floor(end / n)}
              onChange={(v) => setEnd((v ?? -1) * n + (end % n))}
              min={0}
              max={n - 1}
            />
            <Numeric
              label="Destination column"
              value={end % n}
              onChange={(v) => setEnd(Math.floor(end / n) * n + (v ?? -1))}
              min={0}
              max={n - 1}
            />
            <Numeric
              label="Sampled edge-slope constraint"
              value={limit}
              onChange={setLimit}
              min={0.1}
              max={80}
              step={1}
              unit="degrees · scenario"
            />
            <Numeric
              label="Relative slope-cost penalty"
              value={penalty}
              onChange={setPenalty}
              min={0}
              max={100}
              step={0.5}
            />
          </div>
          <p className="lab-equation mono">
            cost = Σ distance × [1 + penalty × (edge slope / constraint)²]
          </p>
          <InputError message={result.error} />
          {route?.status === "unavailable" && (
            <p role="status" className="lab-empty">
              {route.reason}
            </p>
          )}
          {route?.status === "available" && (
            <div className="lab-metrics">
              <Metric
                label="Proposed path length"
                value={number(route.lengthM / 1000, 2)}
                unit="km"
              />
              <Metric
                label="Sampled ascent"
                value={number(route.ascentM, 1)}
                unit="m"
              />
              <Metric
                label="Largest sampled edge slope"
                value={number(route.maxEdgeSlopeDeg, 2)}
                unit="degrees"
              />
            </div>
          )}
          <button
            className="button outline"
            disabled={!geojson}
            onClick={() =>
              geojson &&
              download(
                `terrainx-proposed-route-${candidate.id}.geojson`,
                JSON.stringify(geojson, null, 2),
                "application/geo+json",
              )
            }
          >
            Export proposed route GeoJSON
          </button>
          <p className="scientific-caveat">
            No diagonal corner cutting across missing/water nodes. Constraints
            test sampled edges only: boulders, cliffs between nodes, bearing
            strength, roof stability, access, wheel slip and safe landing zones
            remain unassessed.
          </p>
        </Panel>
      </div>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="operations"
        question="Where should a field team refine the terrain before testing operations?"
        decision={
          route?.status === "available"
            ? "A connected graph path satisfies the declared sampled-edge rule. It is a reproducible hypothesis for survey and navigation testing, not a route clearance."
            : "The selected evidence and constraints do not produce a supported graph route. Adjust the explicit scenario or collect better terrain evidence; no safe path was invented."
        }
        next="Survey proposed legs with drone photogrammetry/LiDAR and differential GNSS; map obstacles and access restrictions, then measure navigation error, slope, soil strength and wheel slip under a permitted supervised protocol."
        inputs={{
          start,
          end,
          slopeConstraintDeg: limit,
          slopePenalty: penalty,
          spacingM: spacing,
          source: fine ? "Copernicus" : "SRTM",
        }}
        results={route}
        sources={sources}
      />
    </>
  );
}
