/**
 * TypeScript port of science/analysis/terrain.py (same formulas, same numpy-style
 * linear quantiles) plus helpers for the Analog Forensics views. Unit tests check
 * that these reproduce the cached Python metrics exactly.
 */
export type Grid = (number | null)[][];

/** numpy.quantile default ("linear") on a sorted copy. */
export function quantile(values: number[], q: number) {
  if (!values.length) throw new Error("Empty sample");
  const s = [...values].sort((a, b) => a - b),
    pos = (s.length - 1) * q,
    lo = Math.floor(pos),
    hi = Math.min(lo + 1, s.length - 1);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
export function median(values: number[]) {
  return quantile(values, 0.5);
}

/** Interior central-difference slope grid in degrees; null where a neighbor is missing. */
export function slopeGrid(z: Grid, spacingM: number): (number | null)[][] {
  const rows = z.length,
    cols = z[0]?.length ?? 0;
  const out: (number | null)[][] = [];
  for (let r = 1; r < rows - 1; r++) {
    const line: (number | null)[] = [];
    for (let c = 1; c < cols - 1; c++) {
      const e = z[r][c + 1],
        w = z[r][c - 1],
        n = z[r + 1][c],
        s = z[r - 1][c];
      if (e == null || w == null || n == null || s == null) line.push(null);
      else {
        const gx = (e - w) / (2 * spacingM),
          gy = (n - s) / (2 * spacingM);
        line.push((Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI);
      }
    }
    out.push(line);
  }
  return out;
}

/** Least-squares plane z = a·x + b·y + c over valid samples; returns RMS residual. */
export function detrendedRms(z: Grid, spacingM: number) {
  const pts: [number, number, number][] = [];
  z.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v != null) pts.push([c * spacingM, r * spacingM, v]);
    }),
  );
  // Normal equations for [a, b, c].
  let sxx = 0,
    sxy = 0,
    sx = 0,
    syy = 0,
    sy = 0,
    n = 0,
    sxz = 0,
    syz = 0,
    sz = 0;
  for (const [x, y, v] of pts) {
    sxx += x * x;
    sxy += x * y;
    sx += x;
    syy += y * y;
    sy += y;
    n += 1;
    sxz += x * v;
    syz += y * v;
    sz += v;
  }
  const A = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, n],
  ];
  const b = [sxz, syz, sz];
  const det = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(A);
  if (Math.abs(D) < 1e-12) throw new Error("Degenerate plane fit");
  const coef = [0, 1, 2].map(
    (k) => det(A.map((row, i) => row.map((v, j) => (j === k ? b[i] : v)))) / D,
  );
  const mean =
    pts.reduce(
      (s, [x, y, v]) => s + (v - (coef[0] * x + coef[1] * y + coef[2])) ** 2,
      0,
    ) / pts.length;
  return Math.sqrt(mean);
}

export interface TerrainMetrics {
  median_slope_deg: number;
  p90_slope_deg: number;
  relief_m: number;
  detrended_rms_m: number;
  valid_samples: number;
  total_samples: number;
}
export function terrainMetrics(
  z: Grid,
  spacingM: number,
  minFraction = 0.9,
): TerrainMetrics {
  const flat = z.flat(),
    valid = flat.filter((v): v is number => v != null);
  if (z.length < 3 || (z[0]?.length ?? 0) < 3 || !(spacingM > 0))
    throw new Error("Invalid grid or spacing");
  if (valid.length / flat.length < minFraction || valid.length < 9)
    throw new Error("Insufficient valid terrain samples");
  const slopes = slopeGrid(z, spacingM)
    .flat()
    .filter((v): v is number => v != null);
  if (slopes.length < 5)
    throw new Error("Insufficient valid central-difference slopes");
  return {
    median_slope_deg: median(slopes),
    p90_slope_deg: quantile(slopes, 0.9),
    relief_m: quantile(valid, 0.95) - quantile(valid, 0.05),
    detrended_rms_m: detrendedRms(z, spacingM),
    valid_samples: valid.length,
    total_samples: flat.length,
  };
}

/** A surface may be drawn only from a real, complete grid. Never fabricates a mesh. */
export function surfaceFromTerrain(terrain: {
  status: string;
  elevations_m?: (number | null)[][] | null;
}): number[][] | null {
  const g = terrain.elevations_m;
  if (terrain.status !== "available" || !g || !g.length) return null;
  if (
    g.some(
      (row) =>
        row.length !== g[0].length ||
        row.some((v) => v == null || !Number.isFinite(v)),
    )
  )
    return null;
  return g as number[][];
}

/** West–east profile through the centre row and south–north profile through the centre column. */
export function centreProfiles(northToSouth: number[][], spacingM: number) {
  const n = northToSouth.length,
    mid = Math.floor(n / 2),
    half = ((n - 1) / 2) * spacingM;
  return {
    westEast: northToSouth[mid].map((z, c) => ({ d: -half + c * spacingM, z })),
    southNorth: northToSouth
      .map((row, r) => ({ d: half - r * spacingM, z: row[mid] }))
      .reverse(),
  };
}

/** Lambertian hillshade (0..1) on a north-to-south grid; light azimuth 315°, altitude 45°. */
export function hillshade(
  northToSouth: number[][],
  spacingM: number,
  exaggeration = 1,
) {
  const n = northToSouth.length,
    m = northToSouth[0].length;
  const az = (315 * Math.PI) / 180,
    alt = (45 * Math.PI) / 180;
  const L = [
    Math.sin(az) * Math.cos(alt),
    Math.cos(az) * Math.cos(alt),
    Math.sin(alt),
  ];
  const at = (r: number, c: number) =>
    northToSouth[Math.max(0, Math.min(n - 1, r))][
      Math.max(0, Math.min(m - 1, c))
    ] * exaggeration;
  return northToSouth.map((row, r) =>
    row.map((_, c) => {
      const dzdx = (at(r, c + 1) - at(r, c - 1)) / (2 * spacingM),
        dzdy = (at(r - 1, c) - at(r + 1, c)) / (2 * spacingM); // rows run north → south
      const len = Math.hypot(dzdx, dzdy, 1);
      return Math.max(0, (-dzdx * L[0] - dzdy * L[1] + L[2]) / len);
    }),
  );
}
