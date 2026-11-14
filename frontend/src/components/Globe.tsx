import { useEffect, useMemo, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import { useData } from "../lib/data";

/** Live landing globe: real Natural Earth land and the real candidate positions,
 * slowly rotating (static when the reader prefers reduced motion). */
export default function Globe() {
  const data = useData();
  const [land, setLand] = useState<GeoPermissibleObjects | null>(null),
    [lambda, setLambda] = useState(-35),
    [paused, setPaused] = useState(false);
  const drag = useRef<{ x: number; l: number } | null>(null);
  useEffect(() => {
    fetch("/data/land.geojson")
      .then((r) => r.json())
      .then(setLand)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let frame = 0,
      last = performance.now(),
      acc = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      if (acc > 33) {
        setLambda((l) => l - (acc / 1000) * 7);
        acc = 0;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);
  const projection = useMemo(
    () =>
      geoOrthographic()
        .rotate([lambda, -14, 0])
        .translate([310, 290])
        .scale(215)
        .clipAngle(90),
    [lambda],
  );
  const path = geoPath(projection);
  const centre: [number, number] = [-lambda, 14];
  const points = data.candidates
    .filter(
      (c) =>
        geoDistance([c.longitude, c.latitude], centre) < Math.PI / 2 - 0.05,
    )
    .map((c) => {
      const [x, y] = projection([c.longitude, c.latitude]) ?? [0, 0];
      return {
        id: c.id,
        x,
        y,
        kind: c.benchmark
          ? "reference"
          : c.status === "CHARACTERIZED CANDIDATE"
            ? "characterized"
            : "screened",
      };
    });
  const regions = data.regions.map((r) => {
    const [w, s, e, n] = r.bounds;
    return {
      id: r.id,
      d:
        path({
          type: "Polygon",
          coordinates: [
            [
              [w, s],
              [w, n],
              [e, n],
              [e, s],
              [w, s],
            ],
          ],
        }) ?? "",
    };
  });
  return (
    <div
      className="globe-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        drag.current = null;
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, l: lambda };
        setPaused(true);
      }}
      onPointerMove={(e) => {
        if (drag.current)
          setLambda(drag.current.l + (e.clientX - drag.current.x) * 0.35);
      }}
      onPointerUp={() => (drag.current = null)}
    >
      <svg
        viewBox="0 0 620 580"
        role="img"
        aria-label={`Rotating globe from real Natural Earth land boundaries showing ${data.summary.shortlisted_candidates} algorithmic candidates and ${data.summary.benchmark_sites} benchmark references; Moon and Mars symbols are not to scale`}
      >
        <defs>
          <radialGradient id="ocean" cx="42%" cy="38%">
            <stop stopColor="#17344a" />
            <stop offset="1" stopColor="#080D18" />
          </radialGradient>
          <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#2a8f86" />
            <stop offset="1" stopColor="#14635f" />
          </linearGradient>
          <radialGradient id="glow">
            <stop offset="0.82" stopColor="#35C3B0" stopOpacity="0" />
            <stop offset="1" stopColor="#35C3B0" stopOpacity="0.16" />
          </radialGradient>
        </defs>
        <ellipse
          cx="310"
          cy="290"
          rx="293"
          ry="119"
          transform="rotate(24 310 290)"
          fill="none"
          stroke="#97A8BD"
          strokeOpacity=".5"
          strokeWidth="1"
        />
        <circle cx="310" cy="290" r="236" fill="url(#glow)" />
        <circle
          cx="310"
          cy="290"
          r="216"
          fill="url(#ocean)"
          stroke="#35C3B0"
          strokeWidth="1.5"
        />
        <path
          d={path(geoGraticule10()) ?? ""}
          stroke="#52708a"
          strokeOpacity=".55"
          strokeWidth=".6"
          fill="none"
        />
        {land ? <path d={path(land) ?? ""} fill="url(#land)" /> : null}
        {regions.map((r) => (
          <path
            key={r.id}
            d={r.d}
            fill="#35C3B0"
            fillOpacity=".12"
            stroke="#C6D7E8"
            strokeDasharray="3 2"
            strokeWidth="1"
          />
        ))}
        {points.map((p) =>
          p.kind === "reference" ? (
            <rect
              key={p.id}
              x={p.x - 4}
              y={p.y - 4}
              width="8"
              height="8"
              transform={`rotate(45 ${p.x} ${p.y})`}
              fill="#111a29"
              stroke="#C6D7E8"
              strokeWidth="1.6"
            />
          ) : (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r="4.2"
              fill={p.kind === "characterized" ? "#35C3B0" : "#F17E5A"}
              stroke="#080D18"
              strokeWidth="1.4"
            />
          ),
        )}
        <circle cx="79" cy="181" r="16" fill="#C6D7E8" />
        <text x="95" y="155" fill="#F2F5FA" fontSize="15" fontFamily="Inter">
          MOON
        </text>
        <circle cx="556" cy="417" r="16" fill="#F17E5A" />
        <text x="571" y="450" fill="#F2F5FA" fontSize="15" fontFamily="Inter">
          MARS
        </text>
      </svg>
    </div>
  );
}
