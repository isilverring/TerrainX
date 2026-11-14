import { useEffect, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
export default function Globe() {
  const [land, setLand] = useState<GeoPermissibleObjects | null>(null);
  useEffect(() => {
    fetch("/data/land.geojson")
      .then((r) => r.json())
      .then(setLand)
      .catch(() => {});
  }, []);
  const projection = geoOrthographic()
    .rotate([15, -16, 0])
    .translate([310, 290])
    .scale(215);
  const path = geoPath(projection);
  return (
    <div className="globe-wrap">
      <svg
        viewBox="0 0 620 580"
        role="img"
        aria-label="Decorative globe from real Natural Earth land boundaries; Moon and Mars symbols are not to scale"
      >
        <defs>
          <radialGradient id="ocean">
            <stop stopColor="#152e3d" />
            <stop offset="1" stopColor="#080D18" />
          </radialGradient>
          <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#35C3B0" />
            <stop offset="1" stopColor="#168d88" />
          </linearGradient>
        </defs>
        <ellipse
          cx="310"
          cy="290"
          rx="293"
          ry="119"
          transform="rotate(24 310 290)"
          fill="none"
          stroke="#97A8BD"
          strokeWidth="1"
        />
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
          strokeWidth=".65"
          fill="none"
        />
        {land ? <path d={path(land) ?? ""} fill="url(#land)" /> : null}
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
