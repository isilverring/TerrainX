import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Microscope, RotateCcw, RotateCw, TriangleAlert } from "lucide-react";
import type { Assessment, Candidate, Target } from "../lib/models";
import { earthContext } from "../lib/earthContext";
import { number, labels, unitSuffix } from "../lib/data";
import {
  centreProfiles,
  hillshade,
  slopeGrid,
  surfaceFromTerrain,
  terrainMetrics,
} from "../lib/terrain";
import { EvidenceTag } from "./ui";
import { fetchScienceJson, scienceAssetUrl } from "../lib/release";

/* ------------------------------------------------------------------------------
 * Side-by-side shaded 3D surfaces. Both panels share the horizontal scale, the
 * vertical exaggeration and the colour scale, so relief is visually comparable.
 * Heights are relative to each patch's own median: absolute Earth, Mars and Moon
 * elevations use different datums and are never compared.
 * ---------------------------------------------------------------------------- */

type Mode = "analysis" | "context";
interface Patch {
  grid: number[][]; // rows north-to-south, columns west-to-east (metres)
  spacingM: number;
}
interface PlanetContext {
  target_id: string;
  elevations_m: number[][];
  sample_spacing_m: number;
  native_resolution_m: { x: number; y: number };
  dataset: string;
  provenance: { source_url: string; raster_sha256: string | null };
}
interface View {
  yaw: number;
  pitch: number;
  exaggeration: number;
}

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b),
    m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function quantile(values: number[], q: number) {
  const s = [...values].sort((a, b) => a - b),
    pos = (s.length - 1) * q,
    lo = Math.floor(pos);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
}
export function relativeGrid(grid: number[][]) {
  const flat = grid.flat(),
    m = median(flat);
  return {
    rel: grid.map((row) => row.map((z) => z - m)),
    relief: quantile(flat, 0.95) - quantile(flat, 0.05),
    range: Math.max(...flat) - Math.min(...flat),
  };
}

// Shared hypsometric ramp (relative metres), deliberately neutral across bodies.
const RAMP: [number, [number, number, number]][] = [
  [0, [22, 52, 92]],
  [0.35, [36, 122, 138]],
  [0.5, [53, 195, 176]],
  [0.68, [196, 186, 140]],
  [0.85, [214, 160, 112]],
  [1, [242, 245, 250]],
];
export function rampColor(t: number) {
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < RAMP.length; i++)
    if (x <= RAMP[i][0]) {
      const [a, ca] = RAMP[i - 1],
        [b, cb] = RAMP[i],
        f = (x - a) / (b - a);
      return ca.map((v, k) => v + (cb[k] - v) * f) as [number, number, number];
    }
  return RAMP[RAMP.length - 1][1];
}

function drawSurface(
  canvas: HTMLCanvasElement,
  patch: { rel: number[][]; spacingM: number },
  view: View,
  colourRange: number,
  label: string,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2),
    width = canvas.clientWidth,
    height = canvas.clientHeight;
  if (!width || !height) return;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const { rel, spacingM } = patch,
    n = rel.length,
    half = ((n - 1) / 2) * spacingM,
    extent = 2 * half;
  const yaw = (view.yaw * Math.PI) / 180,
    pitch = (view.pitch * Math.PI) / 180;
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch);
  // Same pixels-per-metre in every panel of the same mode.
  const scale = (Math.min(width, height * 1.3) * 0.68) / extent;
  const ox = width / 2,
    oy = height * 0.56;
  const zOf = (z: number) => z * view.exaggeration;
  const project = (x: number, y: number, z: number) => {
    const xr = x * cy - y * sy,
      yr = x * sy + y * cy;
    return {
      sx: ox + xr * scale,
      sy: oy - (zOf(z) * cp + yr * sp) * scale,
      depth: yr * cp - zOf(z) * sp,
    };
  };
  const base = -colourRange * 1.15;
  const pts = rel.map((row, r) =>
    row.map((z, c) => project(-half + c * spacingM, half - r * spacingM, z)),
  );
  // Light from the north-west at 45° elevation, fixed to the terrain like a hillshade.
  const light = [-Math.SQRT1_2 * 0.707, Math.SQRT1_2 * 0.707, 0.707];
  type Face = {
    depth: number;
    poly: { sx: number; sy: number }[];
    fill: string;
  };
  const faces: Face[] = [];
  for (let r = 0; r < n - 1; r++)
    for (let c = 0; c < n - 1; c++) {
      const z00 = rel[r][c],
        z01 = rel[r][c + 1],
        z10 = rel[r + 1][c],
        z11 = rel[r + 1][c + 1];
      // Surface normal from exaggerated gradients (x east, y north).
      const dzdx = zOf((z01 + z11 - z00 - z10) / 2) / spacingM,
        dzdy = zOf((z00 + z01 - z10 - z11) / 2) / spacingM;
      const len = Math.hypot(dzdx, dzdy, 1),
        shade = (-dzdx * light[0] - dzdy * light[1] + light[2]) / len;
      const t = ((z00 + z01 + z10 + z11) / 4 / colourRange + 1) / 2;
      const [cr, cg, cb] = rampColor(t),
        k = 0.38 + 0.62 * Math.max(0, shade);
      const poly = [pts[r][c], pts[r][c + 1], pts[r + 1][c + 1], pts[r + 1][c]];
      faces.push({
        depth: poly.reduce((s, p) => s + p.depth, 0) / 4,
        poly,
        fill: `rgb(${(cr * k) | 0},${(cg * k) | 0},${(cb * k) | 0})`,
      });
    }
  // Skirts make the block read as a solid volume.
  const edges: [number, number][][] = [
    Array.from({ length: n }, (_, c) => [0, c] as [number, number]),
    Array.from({ length: n }, (_, c) => [n - 1, c] as [number, number]),
    Array.from({ length: n }, (_, r) => [r, 0] as [number, number]),
    Array.from({ length: n }, (_, r) => [r, n - 1] as [number, number]),
  ];
  for (const edge of edges)
    for (let i = 0; i < edge.length - 1; i++) {
      const [r0, c0] = edge[i],
        [r1, c1] = edge[i + 1];
      const x0 = -half + c0 * spacingM,
        y0 = half - r0 * spacingM,
        x1 = -half + c1 * spacingM,
        y1 = half - r1 * spacingM;
      const poly = [
        pts[r0][c0],
        pts[r1][c1],
        project(x1, y1, base),
        project(x0, y0, base),
      ];
      faces.push({
        depth: poly.reduce((s, p) => s + p.depth, 0) / 4 + 1e-6,
        poly,
        fill: "#16202f",
      });
    }
  faces.sort((a, b) => b.depth - a.depth);
  ctx.lineJoin = "round";
  for (const f of faces) {
    ctx.beginPath();
    ctx.moveTo(f.poly[0].sx, f.poly[0].sy);
    for (let i = 1; i < f.poly.length; i++)
      ctx.lineTo(f.poly[i].sx, f.poly[i].sy);
    ctx.closePath();
    ctx.fillStyle = f.fill;
    ctx.fill();
    ctx.strokeStyle = f.fill;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  // Corner compass: the projected direction of north.
  const o = project(0, 0, 0),
    nn = project(0, half, 0);
  const vx = nn.sx - o.sx,
    vy = nn.sy - o.sy,
    vl = Math.hypot(vx, vy) || 1;
  const kx = width - 30,
    ky = 30;
  ctx.strokeStyle = "#4a5d78";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(kx, ky, 15, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = "#c6d7e8";
  ctx.fillStyle = "#c6d7e8";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(kx - (vx / vl) * 9, ky - (vy / vl) * 9);
  ctx.lineTo(kx + (vx / vl) * 11, ky + (vy / vl) * 11);
  ctx.stroke();
  ctx.font = "600 10px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", kx + (vx / vl) * 23, ky + (vy / vl) * 23 + 3.5);
  const barKm = extent >= 60000 ? 20 : 8,
    barPx = barKm * 1000 * scale;
  ctx.textAlign = "left";
  ctx.fillStyle = "#97a8bd";
  ctx.fillRect(14, height - 22, barPx, 2);
  ctx.fillText(`${barKm} km`, 14, height - 28);
  ctx.textAlign = "right";
  ctx.fillText(label, width - 12, height - 14);
}

function SurfaceCanvas({
  patch,
  view,
  colourRange,
  label,
  onDrag,
}: {
  patch: { rel: number[][]; spacingM: number } | null;
  view: View;
  colourRange: number;
  label: string;
  onDrag: (dx: number, dy: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    last = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !patch) return;
    const draw = () => drawSurface(canvas, patch, view, colourRange, label);
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [patch, view, colourRange, label]);
  function down(e: ReactPointerEvent<HTMLCanvasElement>) {
    last.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!last.current) return;
    onDrag(e.clientX - last.current.x, e.clientY - last.current.y);
    last.current = { x: e.clientX, y: e.clientY };
  }
  return (
    <canvas
      ref={ref}
      className="surface-canvas"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
      role="img"
      aria-label={`${label} shaded 3D surface. Drag to rotate.`}
    />
  );
}

const planetRequests = new Map<string, Promise<PlanetContext[]>>();
function loadPlanetContext() {
  const key = scienceAssetUrl("planetary_context.json");
  if (!planetRequests.has(key))
    planetRequests.set(
      key,
      fetchScienceJson<{ targets: PlanetContext[] }>("planetary_context.json")
        .then((d) => d.targets)
        .catch((e) => {
          planetRequests.delete(key);
          throw e;
        }),
    );
  return planetRequests.get(key)!;
}

const DEFAULT_VIEW: View = { yaw: -32, pitch: 38, exaggeration: 3 };
const EXAGGERATIONS = [1, 3, 5] as const;
const SLOPE_RAMP = (t: number): [number, number, number] => {
  // 0° → deep blue, mid → amber, steep → white
  const stops: [number, [number, number, number]][] = [
    [0, [14, 32, 58]],
    [0.4, [42, 120, 140]],
    [0.75, [230, 180, 120]],
    [1, [250, 245, 235]],
  ];
  const x = Math.min(1, Math.max(0, t));
  for (let i = 1; i < stops.length; i++)
    if (x <= stops[i][0]) {
      const [a, ca] = stops[i - 1],
        [b, cb] = stops[i],
        f = (x - a) / (b - a);
      return ca.map((v, k) => v + (cb[k] - v) * f) as [number, number, number];
    }
  return stops[stops.length - 1][1];
};

/** 2D heightmap (relative elevation × hillshade) drawn cell by cell from the real grid. */
function HeightMap({
  rel,
  spacingM,
  colourRange,
  exaggeration,
  showPoints,
  label,
}: {
  rel: number[][];
  spacingM: number;
  colourRange: number;
  exaggeration: number;
  showPoints: boolean;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const n = rel.length,
      size = 280,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const shade = hillshade(rel, spacingM, exaggeration),
      cell = size / n;
    rel.forEach((row, r) =>
      row.forEach((z, c) => {
        const [cr, cg, cb] = rampColor((z / colourRange + 1) / 2),
          k = 0.45 + 0.55 * shade[r][c];
        ctx.fillStyle = `rgb(${(cr * k) | 0},${(cg * k) | 0},${(cb * k) | 0})`;
        ctx.fillRect(c * cell, r * cell, cell + 0.6, cell + 0.6);
      }),
    );
    if (showPoints) {
      ctx.fillStyle = "#080d18";
      rel.forEach((row, r) =>
        row.forEach((_, c) => {
          ctx.beginPath();
          ctx.arc((c + 0.5) * cell, (r + 0.5) * cell, 1.8, 0, 2 * Math.PI);
          ctx.fill();
        }),
      );
    }
  }, [rel, spacingM, colourRange, exaggeration, showPoints]);
  return (
    <canvas
      ref={ref}
      className="forensic-map"
      role="img"
      aria-label={`${label} relative elevation heightmap with hillshade, north up`}
    />
  );
}
function SlopeMap({
  slopes,
  maxSlope,
  label,
}: {
  slopes: (number | null)[][];
  maxSlope: number;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !slopes.length) return;
    const n = slopes.length,
      size = 140,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = size / n;
    slopes.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v == null) {
          ctx.fillStyle = "#3a1f1a";
        } else {
          const [cr, cg, cb] = SLOPE_RAMP(v / Math.max(maxSlope, 1e-6));
          ctx.fillStyle = `rgb(${cr | 0},${cg | 0},${cb | 0})`;
        }
        ctx.fillRect(c * cell, r * cell, cell + 0.6, cell + 0.6);
      }),
    );
  }, [slopes, maxSlope]);
  return (
    <canvas
      ref={ref}
      className="forensic-slope"
      role="img"
      aria-label={`${label} slope map (interior samples)`}
    />
  );
}

/** Elevation profiles drawn at a stated vertical exaggeration (equal horizontal scale). */
function Profiles({
  earth,
  planet,
  spacingM,
  exaggeration,
  planetName,
}: {
  earth: number[][] | null;
  planet: number[][] | null;
  spacingM: number;
  exaggeration: number;
  planetName: string;
}) {
  const width = 520;
  const lines = (["westEast", "southNorth"] as const).map((dir) => {
    const e = earth ? centreProfiles(earth, spacingM)[dir] : null,
      p = planet ? centreProfiles(planet, spacingM)[dir] : null;
    return { dir, e, p };
  });
  const extent = ((earth ?? planet)!.length - 1) * spacingM;
  const zs = lines.flatMap((l) =>
    [...(l.e ?? []), ...(l.p ?? [])].map((x) => x.z),
  );
  const lo = Math.min(...zs),
    hi = Math.max(...zs);
  const pxPerM = width / extent;
  const wanted = (hi - lo) * pxPerM * exaggeration;
  const height = Math.max(40, Math.min(170, wanted));
  const shownVE =
    wanted > 0 ? (exaggeration * height) / Math.max(wanted, 40) : exaggeration;
  const sx = (d: number) => ((d + extent / 2) / extent) * width;
  const sy = (z: number) =>
    10 + height - ((z - lo) / Math.max(hi - lo, 1e-9)) * height;
  const path = (pts: { d: number; z: number }[]) =>
    pts
      .map(
        (p, i) => `${i ? "L" : "M"}${sx(p.d).toFixed(1)},${sy(p.z).toFixed(1)}`,
      )
      .join("");
  const fitted = Math.abs(shownVE - exaggeration) > 0.05;
  return (
    <div className="profiles">
      {lines.map((l) => (
        <figure key={l.dir}>
          <figcaption>
            {l.dir === "westEast" ? "West → East" : "South → North"} profile
            through the centre
          </figcaption>
          <svg
            viewBox={`0 0 ${width} ${height + 26}`}
            role="img"
            aria-label={`${l.dir} elevation profiles, relative metres`}
          >
            <line
              x1="0"
              x2={width}
              y1={height + 10}
              y2={height + 10}
              stroke="#29384e"
            />
            {l.e ? (
              <path
                d={path(l.e)}
                fill="none"
                stroke="#35C3B0"
                strokeWidth="2"
              />
            ) : null}
            {l.p ? (
              <path
                d={path(l.p)}
                fill="none"
                stroke="#F17E5A"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
            ) : null}
            <text x="0" y={height + 24} fill="#97A8BD" fontSize="10">
              −{(extent / 2000).toFixed(0)} km
            </text>
            <text
              x={width}
              y={height + 24}
              fill="#97A8BD"
              fontSize="10"
              textAnchor="end"
            >
              +{(extent / 2000).toFixed(0)} km
            </text>
          </svg>
        </figure>
      ))}
      <p className="caption">
        <span className="swatch earth" /> Earth{" "}
        <span className="swatch planet" /> {planetName} · relative elevation
        (each patch minus its median), range {number(hi - lo, 0)} m · vertical
        exaggeration{" "}
        <strong>×{fitted ? number(shownVE, 1) : exaggeration}</strong>
        {fitted ? ` (×${exaggeration} requested; reduced to fit)` : ""}.
      </p>
    </div>
  );
}

function QuantTable({
  candidate,
  target,
  assessment,
  mode,
  earthCtx,
  planetCtx,
}: {
  candidate: Candidate;
  target: Target;
  assessment: Assessment;
  mode: Mode;
  earthCtx: number[][] | null;
  planetCtx: number[][] | null;
}) {
  const lattice = mode === "analysis";
  const earth = lattice
    ? candidate.terrain.metrics
    : earthCtx
      ? terrainMetrics(earthCtx, 2000)
      : null;
  const planet = lattice
    ? target.terrain.metrics
    : planetCtx
      ? terrainMetrics(planetCtx, 2000)
      : null;
  const f = assessment.fidelity;
  return (
    <div className="table-scroll">
      <table className="forensic-table">
        <caption>
          {lattice
            ? "Analysis lattice: the exact cached metrics behind F."
            : "Regional context: metrics recomputed in the browser for interpretation only; they never enter F, U, C or P."}
        </caption>
        <thead>
          <tr>
            <th>Measure</th>
            <th>Earth</th>
            <th>{target.name}</th>
            {lattice ? (
              <>
                <th>τ</th>
                <th>sᵢ</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => {
            const comp = f.components.find((x) => x.feature === k);
            return (
              <tr key={k}>
                <th>{labels[k]}</th>
                <td>
                  {earth
                    ? `${number(earth[k], 2)}${unitSuffix(k)}`
                    : "unavailable"}
                </td>
                <td>
                  {planet
                    ? `${number(planet[k], 2)}${unitSuffix(k)}`
                    : "not assessed"}
                </td>
                {lattice ? (
                  <>
                    <td>
                      {comp ? `${comp.tolerance}${unitSuffix(k)}` : "—"}
                    </td>
                    <td>{comp ? number(comp.similarity, 3) : "—"}</td>
                  </>
                ) : null}
              </tr>
            );
          })}
          <tr>
            <th>Valid samples (missing-data flag)</th>
            <td>
              {earth
                ? `${earth.valid_samples}/${earth.total_samples ?? earth.valid_samples}`
                : "—"}
              {earth &&
              earth.valid_samples <
                Number(earth.total_samples ?? earth.valid_samples)
                ? " ⚑ missing samples"
                : earth
                  ? " · complete"
                  : ""}
            </td>
            <td>
              {planet
                ? `${planet.valid_samples}/${planet.total_samples ?? planet.valid_samples}`
                : "—"}
            </td>
            {lattice ? <td colSpan={2} /> : null}
          </tr>
          <tr>
            <th>Sample spacing · footprint</th>
            <td>{lattice ? "4 km · 24 km" : "2 km · 96 km"}</td>
            <td>{lattice ? "4 km · 24 km" : "2 km · 96 km"}</td>
            {lattice ? <td colSpan={2} /> : null}
          </tr>
          <tr>
            <th>Native source resolution</th>
            <td>
              {lattice
                ? "≈ 90 m (SRTM 3″)"
                : "AWS Terrain Tiles mosaic; z8 pixel support varies with latitude (see source caption), not uniform native DEM resolution"}
            </td>
            <td>
              ≈ {number((target.terrain.native_resolution_m?.y ?? 0) / 1000, 2)}{" "}
              km N–S ·{" "}
              {number((target.terrain.native_resolution_m?.x ?? 0) / 1000, 2)}{" "}
              km E–W
            </td>
            {lattice ? <td colSpan={2} /> : null}
          </tr>
          {lattice ? (
            <tr className="f-row">
              <th>Terrain fidelity F</th>
              <td colSpan={4}>
                {f.value != null ? (
                  <>
                    <strong className="mono">{number(f.value, 1)}</strong> = 100
                    × mean(sᵢ) · scale checks passed (same spacing and
                    footprint, native pixels ≤ 1.05 × spacing)
                  </>
                ) : (
                  <>Not shown: {f.reason ?? "scale checks failed"}</>
                )}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default function TerrainViewer({
  candidate,
  target,
  assessment,
}: {
  candidate: Candidate;
  target: Target;
  assessment: Assessment;
}) {
  const [mode, setMode] = useState<Mode>("analysis"),
    [view3d, setView3d] = useState(false),
    [view, setView] = useState<View>(DEFAULT_VIEW),
    [earthCtx, setEarthCtx] = useState<Patch | null>(null),
    [earthMeta, setEarthMeta] = useState<{
      pixel: number;
      tiles: number;
    } | null>(null),
    [planetCtx, setPlanetCtx] = useState<PlanetContext | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const body = target.body;

  useEffect(() => {
    if (mode !== "context") return;
    let live = true;
    setLoading(true);
    setError("");
    setEarthCtx(null);
    Promise.all([
      earthContext(candidate.id, candidate.latitude, candidate.longitude),
      target.reference_id ? Promise.resolve([]) : loadPlanetContext(),
    ])
      .then(([earth, planets]) => {
        if (!live) return;
        setEarthCtx({ grid: earth.elevations, spacingM: earth.spacingM });
        setEarthMeta({ pixel: earth.pixelSizeM, tiles: earth.tiles.length });
        setPlanetCtx(planets.find((p) => p.target_id === target.id) ?? null);
      })
      .catch((e) => {
        if (!live) return;
        setError(String(e instanceof Error ? e.message : e));
        setMode("analysis");
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [mode, candidate, target.id, target.reference_id]);

  const analysisEarth: Patch | null = useMemo(() => {
    const g = surfaceFromTerrain(candidate.terrain);
    // SRTM rows are stored south-to-north; the viewer uses north-to-south.
    return g
      ? {
          grid: [...g].reverse(),
          spacingM: candidate.terrain.sample_spacing_m ?? 4000,
        }
      : null;
  }, [candidate]);
  const analysisPlanet: Patch | null = useMemo(() => {
    const g = surfaceFromTerrain(target.terrain);
    return g
      ? { grid: g, spacingM: target.terrain.sample_spacing_m ?? 4000 }
      : null;
  }, [target]);

  const earth = mode === "analysis" ? analysisEarth : earthCtx;
  const planet =
    mode === "analysis"
      ? analysisPlanet
      : planetCtx
        ? { grid: planetCtx.elevations_m, spacingM: planetCtx.sample_spacing_m }
        : null;
  const e = useMemo(() => (earth ? relativeGrid(earth.grid) : null), [earth]),
    p = useMemo(() => (planet ? relativeGrid(planet.grid) : null), [planet]);
  const colourRange = Math.max(
    1,
    ...[e, p].filter(Boolean).flatMap((x) => x!.rel.flat().map(Math.abs)),
  );
  const spacing = (earth ?? planet)?.spacingM ?? 4000;
  const eSlopes = useMemo(
      () => (earth ? slopeGrid(earth.grid, earth.spacingM) : []),
      [earth],
    ),
    pSlopes = useMemo(
      () => (planet ? slopeGrid(planet.grid, planet.spacingM) : []),
      [planet],
    );
  const maxSlope = Math.max(
    0.5,
    ...[...eSlopes.flat(), ...pSlopes.flat()].filter(
      (v): v is number => v != null,
    ),
  );
  const drag = (dx: number, dy: number) =>
    setView((v) => ({
      ...v,
      yaw: v.yaw + dx * 0.4,
      pitch: Math.min(80, Math.max(12, v.pitch - dy * 0.3)),
    }));
  const extentKm = mode === "analysis" ? 24 : 96;
  const planetSource = body === "Mars" ? "MOLA MEGDR 16 ppd" : "LOLA LDEM_16";
  const panels = [
    {
      key: "earth",
      title: `Earth · ${candidate.name}`,
      source:
        mode === "analysis"
          ? "NASA SRTM via OpenTopoData · 7×7 at 4 km · cached"
          : `AWS Terrain Tiles z8 (~${number((earthMeta?.pixel ?? 0) / 1000, 2)} km px) · live · visualisation only`,
      stats: e,
      rel: e?.rel ?? null,
      slopes: eSlopes,
      cls: "earth",
      label: "Earth",
    },
    {
      key: "planet",
      title: `${body} · ${target.name}`,
      source:
        mode === "analysis"
          ? `${planetSource} · 7×7 at 4 km · used for F`
          : planetCtx
            ? `${planetSource} · native ${number(planetCtx.native_resolution_m.y / 1000, 1)} km px · visualisation only`
            : planetSource,
      stats: p,
      rel: p?.rel ?? null,
      slopes: pSlopes,
      cls: body === "Mars" ? "mars" : "moon",
      label: body,
    },
  ];
  return (
    <section
      className="science-section terrain-viewer"
      aria-labelledby="viewer-title"
    >
      <div className="section-heading">
        <h2 id="viewer-title">
          <Microscope size={20} /> Analog Forensics
        </h2>
        <EvidenceTag kind={mode === "analysis" ? "MEASURED" : "DERIVED"} />
      </div>
      <p>
        Measured terrain, side by side: both panels share the horizontal scale (
        {extentKm} × {extentKm} km), the vertical exaggeration and the colour
        scale. Heights are relative to each patch’s median; absolute Earth and{" "}
        {body} elevations use different datums and are never compared. Grids are
        drawn cell by cell from the actual elevation arrays — no interpolation
        or procedural detail is added.
      </p>
      <div className="viewer-controls">
        <div className="segmented" role="group" aria-label="Viewer scale">
          <button
            className={mode === "analysis" ? "active" : ""}
            aria-pressed={mode === "analysis"}
            onClick={() => setMode("analysis")}
          >
            Analysis lattice · 24 km (used for F)
          </button>
          <button
            className={mode === "context" ? "active" : ""}
            disabled={!!target.reference_id}
            title={target.reference_id ? "No 96 km context window exists for this polar reference; the measured 24 km lattice remains available." : undefined}
            aria-pressed={mode === "context"}
            onClick={() => setMode("context")}
          >
            Regional context · 96 km
          </button>
        </div>
        <div className="segmented" role="group" aria-label="View type">
          <button
            className={!view3d ? "active" : ""}
            aria-pressed={!view3d}
            onClick={() => setView3d(false)}
          >
            2D maps
          </button>
          <button
            className={view3d ? "active" : ""}
            aria-pressed={view3d}
            onClick={() => setView3d(true)}
          >
            3D surface
          </button>
        </div>
        <div
          className="segmented"
          role="group"
          aria-label="Vertical exaggeration"
        >
          {EXAGGERATIONS.map((x) => (
            <button
              key={x}
              className={view.exaggeration === x ? "active" : ""}
              aria-pressed={view.exaggeration === x}
              onClick={() => setView((v) => ({ ...v, exaggeration: x }))}
            >
              ×{x}
            </button>
          ))}
        </div>
        {view3d ? (
          <div className="viewer-buttons">
            <button
              onClick={() => setView((v) => ({ ...v, yaw: v.yaw - 30 }))}
              aria-label="Rotate left"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setView((v) => ({ ...v, yaw: v.yaw + 30 }))}
              aria-label="Rotate right"
            >
              <RotateCw size={15} />
            </button>
            <button
              onClick={() =>
                setView((v) => ({
                  ...DEFAULT_VIEW,
                  exaggeration: v.exaggeration,
                }))
              }
            >
              Reset view
            </button>
          </div>
        ) : null}
      </div>
      <p className="ve-statement">
        Vertical exaggeration: <strong>×{view.exaggeration}</strong> (applies to
        hillshade, 3D surfaces and profiles). Horizontal scale is true.
      </p>
      {error ? (
        <p className="warning-inline viewer-warning">
          <TriangleAlert size={14} />
          Live Earth terrain tiles were unavailable ({error}). Showing the
          cached analysis lattice instead.
        </p>
      ) : null}
      <div className="viewer-grid">
        {panels.map((panel) => (
          <figure key={panel.key} className={`viewer-panel ${panel.cls}`}>
            <figcaption>
              <strong>{panel.title}</strong>
              <span>{panel.source}</span>
            </figcaption>
            {loading && mode === "context" ? (
              <div className="viewer-empty">Loading terrain…</div>
            ) : panel.rel ? (
              view3d ? (
                <SurfaceCanvas
                  patch={{ rel: panel.rel, spacingM: spacing }}
                  view={view}
                  colourRange={colourRange}
                  label={panel.label}
                  onDrag={drag}
                />
              ) : (
                <div className="forensic-pair">
                  <div>
                    <HeightMap
                      rel={panel.rel}
                      spacingM={spacing}
                      colourRange={colourRange}
                      exaggeration={view.exaggeration}
                      showPoints={mode === "analysis"}
                      label={panel.label}
                    />
                    <small>
                      Relative elevation × hillshade · north up · {extentKm} km
                    </small>
                  </div>
                  <div>
                    <SlopeMap
                      slopes={panel.slopes}
                      maxSlope={maxSlope}
                      label={panel.label}
                    />
                    <small>
                      Slope, interior samples (
                      {mode === "analysis" ? "8 km" : "4 km"} baseline) · 0–
                      {number(maxSlope, 1)}°
                    </small>
                  </div>
                </div>
              )
            ) : (
              <div className="viewer-empty">
                {panel.label} terrain not assessed: no compatible DEM loaded, so
                no surface is drawn.
              </div>
            )}
            <dl className="viewer-stats">
              <div>
                <dt>Relief Q95−Q05</dt>
                <dd className="mono">
                  {panel.stats ? `${number(panel.stats.relief, 0)} m` : "—"}
                </dd>
              </div>
              <div>
                <dt>Full range</dt>
                <dd className="mono">
                  {panel.stats ? `${number(panel.stats.range, 0)} m` : "—"}
                </dd>
              </div>
            </dl>
          </figure>
        ))}
      </div>
      <div className="viewer-legend" aria-hidden="true">
        <span className="mono">−{number(colourRange, 0)} m</span>
        <i />
        <span className="mono">+{number(colourRange, 0)} m</span>
        <small>relative to each patch median · shared scale</small>
      </div>
      {e && p ? (
        <Profiles
          earth={e.rel}
          planet={p.rel}
          spacingM={spacing}
          exaggeration={view.exaggeration}
          planetName={body}
        />
      ) : null}
      <QuantTable
        candidate={candidate}
        target={target}
        assessment={assessment}
        mode={mode}
        earthCtx={mode === "context" ? (earthCtx?.grid ?? null) : null}
        planetCtx={
          mode === "context" ? (planetCtx?.elevations_m ?? null) : null
        }
      />
      <div className="scientific-warning">
        Resolution mismatch: SRTM point samples (≈ 90 m native) and{" "}
        {planetSource} pixels (≈{" "}
        {number((target.terrain.native_resolution_m?.y ?? 0) / 1000, 1)} km)
        share a 4 km lattice but are not filtered to a common effective
        resolution, so F is exploratory broad morphology, not a validated
        equivalence. Neither surface shows rover-scale rocks, slopes or landing
        hazards.
      </div>
    </section>
  );
}
