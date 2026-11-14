import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Box, RotateCcw, RotateCw, TriangleAlert } from "lucide-react";
import type { Candidate, Target } from "../lib/models";
import { earthContext } from "../lib/earthContext";
import { number } from "../lib/data";
import { EvidenceTag } from "./ui";

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
function rampColor(t: number) {
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

let planetRequest: Promise<PlanetContext[]> | undefined;
function loadPlanetContext() {
  return (planetRequest ??= fetch("/data/planetary_context.json")
    .then((r) => {
      if (!r.ok) throw new Error(`planetary_context.json: HTTP ${r.status}`);
      return r.json();
    })
    .then((d: { targets: PlanetContext[] }) => d.targets)
    .catch((e) => {
      planetRequest = undefined;
      throw e;
    }));
}

const DEFAULT_VIEW: View = { yaw: -32, pitch: 38, exaggeration: 3 };

export default function TerrainViewer({
  candidate,
  target,
}: {
  candidate: Candidate;
  target: Target;
}) {
  const [mode, setMode] = useState<Mode>("context"),
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
      loadPlanetContext(),
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
  }, [mode, candidate, target.id]);

  const analysisEarth: Patch | null = useMemo(() => {
    const g = candidate.terrain.elevations_m;
    if (
      candidate.terrain.status !== "available" ||
      !g ||
      g.flat().some((v) => v == null)
    )
      return null;
    // SRTM rows are stored south-to-north; the viewer uses north-to-south.
    return {
      grid: [...g].reverse() as number[][],
      spacingM: candidate.terrain.sample_spacing_m ?? 4000,
    };
  }, [candidate]);
  const analysisPlanet: Patch | null = useMemo(() => {
    const g = target.terrain.elevations_m;
    if (
      target.terrain.status !== "available" ||
      !g ||
      g.flat().some((v) => v == null)
    )
      return null;
    return {
      grid: g as number[][],
      spacingM: target.terrain.sample_spacing_m ?? 4000,
    };
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
  const drag = (dx: number, dy: number) =>
    setView((v) => ({
      ...v,
      yaw: v.yaw + dx * 0.4,
      pitch: Math.min(80, Math.max(12, v.pitch - dy * 0.3)),
    }));
  const extentKm = mode === "analysis" ? 24 : 96;
  const planetSource = body === "Mars" ? "MOLA MEGDR 16 ppd" : "LOLA LDEM_16";
  return (
    <section
      className="science-section terrain-viewer"
      aria-labelledby="viewer-title"
    >
      <div className="section-heading">
        <h2 id="viewer-title">
          <Box size={20} /> 3D terrain, side by side
        </h2>
        <EvidenceTag kind={mode === "analysis" ? "MEASURED" : "DERIVED"} />
      </div>
      <p>
        Both surfaces share the same horizontal scale ({extentKm} × {extentKm}{" "}
        km), the same vertical exaggeration and the same colour scale, so relief
        can be compared by eye. Heights are relative to each patch’s median:
        absolute Earth and {body} elevations use different datums and are not
        comparable.
      </p>
      <div className="viewer-controls">
        <div className="segmented" role="group" aria-label="Viewer scale">
          <button
            className={mode === "context" ? "active" : ""}
            aria-pressed={mode === "context"}
            onClick={() => setMode("context")}
          >
            Regional context · 96 km
          </button>
          <button
            className={mode === "analysis" ? "active" : ""}
            aria-pressed={mode === "analysis"}
            onClick={() => setMode("analysis")}
          >
            Analysis lattice · 24 km (used for F)
          </button>
        </div>
        <label className="viewer-range">
          Vertical exaggeration <b className="mono">×{view.exaggeration}</b>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={view.exaggeration}
            onChange={(ev) =>
              setView((v) => ({ ...v, exaggeration: Number(ev.target.value) }))
            }
          />
        </label>
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
          <button onClick={() => setView(DEFAULT_VIEW)}>Reset view</button>
        </div>
      </div>
      {error ? (
        <p className="warning-inline viewer-warning">
          <TriangleAlert size={14} />
          Live Earth terrain tiles were unavailable ({error}). Showing the
          cached analysis lattice instead.
        </p>
      ) : null}
      <div className="viewer-grid">
        <figure className="viewer-panel earth">
          <figcaption>
            <strong>Earth · {candidate.name}</strong>
            <span>
              {mode === "analysis"
                ? "NASA SRTM via OpenTopoData · 7×7 at 4 km · cached"
                : `AWS Terrain Tiles z${8} (~${number((earthMeta?.pixel ?? 0) / 1000, 2)} km px) · live · visualisation only`}
            </span>
          </figcaption>
          {loading && mode === "context" ? (
            <div className="viewer-empty">Sampling terrain tiles…</div>
          ) : e ? (
            <SurfaceCanvas
              patch={{ rel: e.rel, spacingM: earth!.spacingM }}
              view={view}
              colourRange={colourRange}
              label="Earth"
              onDrag={drag}
            />
          ) : (
            <div className="viewer-empty">Earth terrain not assessed.</div>
          )}
          <dl className="viewer-stats">
            <div>
              <dt>Relief Q95−Q05</dt>
              <dd className="mono">{e ? `${number(e.relief, 0)} m` : "—"}</dd>
            </div>
            <div>
              <dt>Full range</dt>
              <dd className="mono">{e ? `${number(e.range, 0)} m` : "—"}</dd>
            </div>
          </dl>
        </figure>
        <figure className={`viewer-panel ${body === "Mars" ? "mars" : "moon"}`}>
          <figcaption>
            <strong>
              {body} · {target.name}
            </strong>
            <span>
              {mode === "analysis"
                ? `${planetSource} · 7×7 at 4 km · used for F`
                : planetCtx
                  ? `${planetSource} · native ${number(planetCtx.native_resolution_m.y / 1000, 1)} km px · visualisation only`
                  : planetSource}
            </span>
          </figcaption>
          {loading && mode === "context" ? (
            <div className="viewer-empty">Loading planetary patch…</div>
          ) : p ? (
            <SurfaceCanvas
              patch={{ rel: p.rel, spacingM: planet!.spacingM }}
              view={view}
              colourRange={colourRange}
              label={body}
              onDrag={drag}
            />
          ) : (
            <div className="viewer-empty">
              {body} terrain not assessed: no compatible DEM loaded.
            </div>
          )}
          <dl className="viewer-stats">
            <div>
              <dt>Relief Q95−Q05</dt>
              <dd className="mono">{p ? `${number(p.relief, 0)} m` : "—"}</dd>
            </div>
            <div>
              <dt>Full range</dt>
              <dd className="mono">{p ? `${number(p.range, 0)} m` : "—"}</dd>
            </div>
          </dl>
        </figure>
      </div>
      <div className="viewer-legend" aria-hidden="true">
        <span className="mono">−{number(colourRange, 0)} m</span>
        <i />
        <span className="mono">+{number(colourRange, 0)} m</span>
        <small>relative to each patch median · shared scale</small>
      </div>
      <ul className="viewer-caveats">
        <li>
          Drag either surface to rotate both. The 96 km context grids are{" "}
          <strong>visualisation only</strong> and never enter F, U, C or P; the
          24 km lattice shows the exact samples behind F.
        </li>
        <li>
          Effective resolutions differ: Earth tiles are ~0.5 km, LOLA ~1.9 km
          and MOLA ~3.6 km per pixel, so the Mars surface is smoother than
          reality at this scale.
        </li>
        <li>
          Neither surface shows rover-scale rocks, slopes or landing hazards.
        </li>
      </ul>
    </section>
  );
}
