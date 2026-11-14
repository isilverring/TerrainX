import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  STATION_KINDS,
  elevationAt,
  halfExtent,
  haversineM,
  round7,
  toLatLon,
  toLocal,
  type Station,
  type TerrainGrid,
} from "../lib/fieldStudy";

type Props = {
  grid: TerrainGrid;
  stations: Station[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (lat: number, lon: number) => void;
  onMove: (id: string, lat: number, lon: number) => void;
  onRemove: (id: string) => void;
};

const RES = 400;
const RAMP: [number, [number, number, number]][] = [
  [0, [18, 42, 66]],
  [0.3, [30, 96, 110]],
  [0.55, [72, 138, 116]],
  [0.78, [176, 158, 104]],
  [1, [236, 222, 196]],
];
function ramp(t: number): [number, number, number] {
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
export function contourInterval(range: number) {
  const nice = [5, 10, 20, 25, 50, 100, 200, 250, 500];
  return nice.find((n) => range / n <= 10) ?? 1000;
}

/** Offscreen relief image: bilinear surface between real nodes, hillshade and contours. */
function reliefImage(g: TerrainGrid) {
  const h = halfExtent(g),
    zs = new Float64Array(RES * RES).fill(NaN);
  let lo = Infinity,
    hi = -Infinity;
  for (let j = 0; j < RES; j++)
    for (let i = 0; i < RES; i++) {
      const x = -h + ((i + 0.5) / RES) * 2 * h,
        y = h - ((j + 0.5) / RES) * 2 * h,
        z = elevationAt(g, x, y);
      if (z == null) continue;
      zs[j * RES + i] = z;
      lo = Math.min(lo, z);
      hi = Math.max(hi, z);
    }
  const range = Math.max(1, hi - lo),
    interval = contourInterval(range),
    px = (2 * h) / RES,
    canvas = document.createElement("canvas");
  canvas.width = canvas.height = RES;
  const ctx = canvas.getContext("2d")!,
    img = ctx.createImageData(RES, RES),
    // Sun from the north-west at 45°, vertical exaggeration 4× for legibility.
    az = (315 * Math.PI) / 180,
    alt = Math.PI / 4,
    ve = 4;
  for (let j = 0; j < RES; j++)
    for (let i = 0; i < RES; i++) {
      const k = j * RES + i,
        z = zs[k],
        o = k * 4;
      if (Number.isNaN(z)) {
        img.data.set([10, 16, 26, 255], o);
        continue;
      }
      const ze = zs[j * RES + Math.min(RES - 1, i + 1)],
        zw = zs[j * RES + Math.max(0, i - 1)],
        zn = zs[Math.max(0, j - 1) * RES + i],
        zsouth = zs[Math.min(RES - 1, j + 1) * RES + i];
      const dzdx = Number.isNaN(ze) || Number.isNaN(zw) ? 0 : ((ze - zw) * ve) / (2 * px),
        dzdy = Number.isNaN(zn) || Number.isNaN(zsouth) ? 0 : ((zn - zsouth) * ve) / (2 * px),
        // Surface normal (x east, y north) · light from compass azimuth `az`, elevation `alt`.
        nlen = Math.hypot(dzdx, dzdy, 1),
        shade =
          (-dzdx * Math.sin(az) * Math.cos(alt) - dzdy * Math.cos(az) * Math.cos(alt) + Math.sin(alt)) / nlen;
      const [r, gg, b] = ramp((z - lo) / range),
        s = 0.55 + 0.6 * Math.max(0, Math.min(1, shade));
      const band = Math.floor(z / interval),
        edge =
          (!Number.isNaN(ze) && Math.floor(ze / interval) !== band) ||
          (!Number.isNaN(zsouth) && Math.floor(zsouth / interval) !== band);
      const major = edge && band % 5 === 0;
      const dim = edge ? (major ? 0.55 : 0.78) : 1;
      img.data.set([r * s * dim, gg * s * dim, b * s * dim, 255], o);
    }
  ctx.putImageData(img, 0, 0);
  return { canvas, lo, hi, interval };
}

export default function FieldPlanner({ grid, stations, selected, onSelect, onAdd, onMove, onRemove }: Props) {
  const ref = useRef<HTMLCanvasElement>(null),
    drag = useRef<string | null>(null),
    [hover, setHover] = useState<{ lat: number; lon: number; z: number | null } | null>(null);
  const relief = useMemo(() => reliefImage(grid), [grid]);
  const h = halfExtent(grid);

  // Inset so edge nodes and stations on the footprint boundary stay fully visible.
  const PAD = 0.05;
  const toPx = (W: number, x: number, y: number) => ({
    px: W * PAD + ((x + h) / (2 * h)) * W * (1 - 2 * PAD),
    py: W * PAD + ((h - y) / (2 * h)) * W * (1 - 2 * PAD),
  });
  const fromPx = (W: number, px: number, py: number) => ({
    x: ((px - W * PAD) / (W * (1 - 2 * PAD))) * 2 * h - h,
    y: h - ((py - W * PAD) / (W * (1 - 2 * PAD))) * 2 * h,
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const draw = () => {
      const W = canvas.clientWidth,
        dpr = window.devicePixelRatio || 1;
      if (!W) return;
      canvas.width = W * dpr;
      canvas.height = W * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      const inset = W * PAD,
        inner = W * (1 - 2 * PAD);
      ctx.fillStyle = "#0a101c";
      ctx.fillRect(0, 0, W, W);
      ctx.drawImage(relief.canvas, inset, inset, inner, inner);
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(151,168,189,.55)";
      ctx.lineWidth = 1;
      ctx.strokeRect(inset - 0.5, inset - 0.5, inner + 1, inner + 1);
      ctx.restore();
      ctx.fillStyle = "rgba(151,168,189,.8)";
      ctx.font = "500 10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${(2 * h) / 1000} km SRTM sample footprint`, W - inset, W - inset + 15);
      // Real SRTM sample nodes.
      grid.z.forEach((row, r) =>
        row.forEach((v, c) => {
          const { px, py } = toPx(W, c * grid.spacingM - h, r * grid.spacingM - h);
          ctx.beginPath();
          ctx.arc(px, py, v == null ? 3 : 2.4, 0, Math.PI * 2);
          ctx.fillStyle = v == null ? "rgba(255,90,90,.85)" : "rgba(8,13,24,.75)";
          ctx.fill();
          ctx.strokeStyle = "rgba(242,245,250,.7)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }),
      );
      // Route.
      const pts = stations.map((s) => {
        const p = toLocal(grid, s);
        return { ...toPx(W, p.x, p.y), s };
      });
      if (pts.length > 1) {
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(8,13,24,.55)";
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(p.px, p.py) : ctx.moveTo(p.px, p.py)));
        ctx.stroke();
        ctx.setLineDash([7, 5]);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = "#3ec9b0";
        ctx.stroke();
        ctx.restore();
        ctx.font = "600 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        pts.slice(1).forEach((b, i) => {
          const a = pts[i],
            km = haversineM(a.s, b.s) / 1000,
            mx = (a.px + b.px) / 2,
            my = (a.py + b.py) / 2,
            label = `${km.toFixed(km < 10 ? 2 : 1)} km`,
            w = ctx.measureText(label).width + 10;
          ctx.fillStyle = "rgba(8,13,24,.82)";
          ctx.fillRect(mx - w / 2, my - 9, w, 17);
          ctx.fillStyle = "#e9f6f3";
          ctx.fillText(label, mx, my + 4);
        });
      }
      // Stations.
      pts.forEach(({ px, py, s }, i) => {
        const kind = STATION_KINDS[s.kind];
        if (s.id === selected) {
          ctx.beginPath();
          ctx.arc(px, py, 17, 0, Math.PI * 2);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.fillStyle = kind.tint;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#080d18";
        ctx.stroke();
        ctx.fillStyle = "#080d18";
        ctx.font = "700 11px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(i + 1), px, py + 4);
      });
      // Scale bar (5 km) and north arrow.
      const bar = (5000 / (2 * h)) * inner;
      ctx.fillStyle = "rgba(8,13,24,.7)";
      ctx.fillRect(10, W - 34, bar + 20, 26);
      ctx.fillStyle = "#f2f5fa";
      ctx.fillRect(20, W - 16, bar, 3);
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("5 km", 20, W - 21);
      ctx.save();
      ctx.translate(W - 24, 30);
      ctx.fillStyle = "rgba(8,13,24,.7)";
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f2f5fa";
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(5, 3);
      ctx.lineTo(0, 0);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.fill();
      ctx.font = "700 8px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("N", 0, 14);
      ctx.restore();
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [grid, relief, stations, selected, h]);

  const locate = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { W: r.width, px: e.clientX - r.left, py: e.clientY - r.top };
  };
  const hit = (W: number, px: number, py: number) =>
    stations.find((s) => {
      const p = toLocal(grid, s),
        q = toPx(W, p.x, p.y);
      return Math.hypot(q.px - px, q.py - py) <= 15;
    });

  function down(e: ReactPointerEvent<HTMLCanvasElement>) {
    const { W, px, py } = locate(e),
      s = hit(W, px, py);
    e.currentTarget.focus();
    if (s) {
      drag.current = s.id;
      onSelect(s.id);
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }
    const { x, y } = fromPx(W, px, py);
    if (Math.abs(x) > h || Math.abs(y) > h) return;
    const p = toLatLon(grid, x, y);
    onAdd(round7(p.lat), round7(p.lon));
  }
  function move(e: ReactPointerEvent<HTMLCanvasElement>) {
    const { W, px, py } = locate(e);
    const { x, y } = fromPx(W, px, py),
      cx = Math.max(-h, Math.min(h, x)),
      cy = Math.max(-h, Math.min(h, y)),
      p = toLatLon(grid, cx, cy);
    setHover({ lat: p.lat, lon: p.lon, z: elevationAt(grid, cx, cy) });
    if (drag.current) onMove(drag.current, round7(p.lat), round7(p.lon));
  }
  function key(e: KeyboardEvent<HTMLCanvasElement>) {
    if (!selected) return;
    const s = stations.find((x) => x.id === selected);
    if (!s) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onRemove(s.id);
      return;
    }
    const step = e.shiftKey ? 1000 : 250,
      d = { ArrowUp: [0, step], ArrowDown: [0, -step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[e.key];
    if (!d) return;
    e.preventDefault();
    const p = toLocal(grid, s),
      x = Math.max(-h, Math.min(h, p.x + d[0])),
      y = Math.max(-h, Math.min(h, p.y + d[1])),
      q = toLatLon(grid, x, y);
    onMove(s.id, round7(q.lat), round7(q.lon));
  }

  return (
    <figure className="field-planner">
      <div className="field-canvas-wrap">
        <canvas
          ref={ref}
          tabIndex={0}
          className="field-canvas"
          role="application"
          aria-label="Field study planner. Click to add a station, drag to move it. With a station selected, arrow keys move it 250 m (Shift for 1 km) and Delete removes it."
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onPointerLeave={() => setHover(null)}
          onKeyDown={key}
        />
        <div className="field-readout mono" aria-live="off">
          {hover
            ? `${hover.lat.toFixed(5)}°, ${hover.lon.toFixed(5)}° · ${hover.z == null ? "no sample" : `≈${Math.round(hover.z)} m`}`
            : "Hover for coordinates · click to place a station"}
        </div>
      </div>
      <figcaption>
        <span className="field-legend-ramp" aria-hidden="true" />
        <span className="mono">
          {Math.round(relief.lo)}–{Math.round(relief.hi)} m · contours every {relief.interval} m
        </span>
        <span>
          Relief is a bilinear surface between the {grid.size}×{grid.size} real SRTM samples ({grid.spacingM / 1000} km
          spacing, dots). It shows the regional trend only — not trails, cliffs, access or hazards.
        </span>
      </figcaption>
    </figure>
  );
}
