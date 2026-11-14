/** Compact 7×7 relief tile: real samples relative to their median, rows south→north. */
export default function ElevationGrid({
  z,
  size = 112,
  tint = "earth",
  label,
}: {
  z: (number | null)[][];
  size?: number;
  tint?: "earth" | "moon";
  label: string;
}) {
  const vals = z.flat().filter((v): v is number => v != null);
  if (!vals.length) return null;
  const sorted = [...vals].sort((a, b) => a - b),
    med = sorted[Math.floor(sorted.length / 2)],
    span = Math.max(1, ...vals.map((v) => Math.abs(v - med))),
    n = z.length,
    cell = size / n;
  const color = (v: number) => {
    const t = (v - med) / span; // -1..1
    const l = 30 + 28 * t;
    return tint === "moon" ? `hsl(214 14% ${l + 18}%)` : `hsl(${168 - 120 * Math.max(0, t)} 45% ${l + 8}%)`;
  };
  return (
    <svg className="elev-grid" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${n}×${n} measured elevations, relief ${Math.round(sorted[sorted.length - 1] - sorted[0])} m`}>
      {z.map((row, r) =>
        row.map((v, c) => (
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={(n - 1 - r) * cell}
            width={cell - 1}
            height={cell - 1}
            rx={2}
            fill={v == null ? "transparent" : color(v)}
            stroke={v == null ? "#ff7a7a" : "none"}
            strokeDasharray={v == null ? "2 2" : undefined}
          />
        )),
      )}
    </svg>
  );
}
