import { z } from "zod";
const finite = z.number().finite(),
  nullable = finite.nullable();
export const LAB_MODULES = [
  {
    id: "mineralogy",
    title: "Minerals & materials",
    question: "What is actually in the sample?",
  },
  {
    id: "illumination",
    title: "Thermal & solar",
    question: "When does sunlight reach this location?",
  },
  {
    id: "resources",
    title: "Water, ice & permafrost",
    question: "What is measured, modeled or still unknown?",
  },
  {
    id: "dust",
    title: "Dust & wind",
    question: "What conditions might initiate grain motion?",
  },
  {
    id: "biology",
    title: "Biosignature methods",
    question: "Would the assay separate a signal from contamination?",
  },
  {
    id: "caves",
    title: "Caves & subsurface",
    question: "What can a documented cave help us test?",
  },
  {
    id: "operations",
    title: "Terrain route lab",
    question: "Which sampled route meets the declared constraints?",
  },
  {
    id: "base",
    title: "Lunar base trade-offs",
    question: "How do sunlight and terrain change a preliminary choice?",
  },
] as const;
export type LabModule = (typeof LAB_MODULES)[number]["id"];

export const evidenceRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  categories: z.array(z.string()),
  body: z.string(),
  candidate_id: z.string().nullable(),
  classification: z.string(),
  latitude: nullable,
  longitude: nullable,
  coordinate_scope: z.string(),
  period: z.string(),
  summary: z.string(),
  observations: z.array(
    z
      .object({
        label: z.string(),
        value: z.union([finite, z.array(finite), z.string(), z.null()]),
        unit: z.string(),
        method: z.string(),
        qualifier: z.string(),
        scope: z.string(),
      })
      .passthrough(),
  ),
  references: z.array(
    z.object({
      title: z.string(),
      url: z.string().url(),
      locator: z.string(),
      sha256: z.string().nullable(),
      proof: z.string(),
    }),
  ),
  limitations: z.array(z.string()),
  next_measurement: z.string(),
  proposed_experiment: z.record(z.string(), z.unknown()).nullable(),
});
export const challengeEvidenceSchema = z.object({
  contract: z.literal("terrainx-challenge-evidence-v1"),
  generated_at: z.string(),
  records: z.array(evidenceRecordSchema),
  limitations: z.array(z.string()),
  input_sha256: z.record(z.string(), z.string()),
});
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
export const illuminationSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  latitude: finite,
  longitude: finite,
  centre_elevation_m: finite,
  horizon: z
    .object({
      azimuth_step_deg: finite,
      elevation_deg: z.array(finite).length(72),
      ray_extent_m: z.array(finite).length(72),
      observer_height_m: finite,
      method: z.string(),
    })
    .passthrough(),
  summary: z.object({
    visible_fraction: finite.min(0).max(1),
    geometric_above_zero_fraction: finite.min(0).max(1),
    max_sampled_dark_run_hours: finite,
    boundary_darkness_censored: z.boolean(),
    visible_samples: finite,
    samples: finite,
  }),
  monthly: z
    .array(
      z.object({
        month: finite,
        visible_fraction: finite,
        samples: finite,
        sun_max_elevation_deg: finite,
      }),
    )
    .length(12),
  hourly: z.object({
    sun_elevation_deg: z.array(finite).length(8760),
    sun_azimuth_deg: z.array(finite).length(8760),
    visible: z.array(z.boolean()).length(8760),
  }),
  terrain_source_sha256: z.string(),
  terrain_spacing_m: finite,
  footprint_m: finite,
  p90_slope_deg: finite,
  model_stable_ice_area_fraction: nullable,
  resource_classification: z.string(),
});
export type IlluminationSite = z.infer<typeof illuminationSiteSchema>;
export const illuminationSchema = z.object({
  contract: z.literal("terrainx-lunar-illumination-v1"),
  generated_at: z.string(),
  classification: z.string(),
  frame: z.string(),
  aberration: z.string(),
  period: z.array(z.string()).length(2),
  cadence_hours: finite,
  times_utc: z.array(z.string()).length(8760),
  kernels: z.array(
    z
      .object({
        file: z.string(),
        url: z.string().url(),
        sha256: z.string(),
        bytes: finite,
      })
      .passthrough(),
  ),
  crosschecks: z.array(
    z
      .object({
        site: z.string(),
        epoch_utc: z.string(),
        difference_deg: finite,
        azimuth_difference_deg: finite,
        source_url: z.string().url(),
      })
      .passthrough(),
  ),
  sites: z.array(illuminationSiteSchema),
  limitations: z.array(z.string()),
});
export const operationsProfileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    latitude: finite,
    longitude: finite,
    elevations_m: z.array(z.array(nullable)),
    shape: z.array(finite).length(2),
    sample_spacing_m: finite.positive(),
    footprint_m: finite.positive(),
    slope_baseline_m: finite,
    native_spacing_arcsec: finite,
    vertical_reference: z.string(),
    valid_land_samples: finite,
    water_excluded_samples: finite,
    void_samples: finite,
    external_fill_land_samples: finite,
    sources: z.array(
      z.object({
        url: z.string().url(),
        sha256: z.string(),
        kind: z.string(),
        retrieved_at: z.string(),
        bytes: finite,
      }),
    ),
  })
  .superRefine((p, ctx) => {
    if (
      p.shape[0] !== p.shape[1] ||
      p.shape[0] !== p.elevations_m.length ||
      p.elevations_m.some((r) => r.length !== p.shape[1]) ||
      p.footprint_m !== (p.shape[0] - 1) * p.sample_spacing_m
    )
      ctx.addIssue({
        code: "custom",
        message: "Terrain lattice shape/spacing/footprint mismatch",
      });
  });
export type OperationsProfile = z.infer<typeof operationsProfileSchema>;
export const operationsSchema = z.object({
  contract: z.literal("terrainx-operations-terrain-v1"),
  generated_at: z.string(),
  source: z.string(),
  source_url: z.string().url(),
  classification: z.string(),
  profiles: z.array(operationsProfileSchema),
  limitations: z.array(z.string()),
});
export const dailyExtremesSchema = z.object({
  contract: z.literal("terrainx-daily-extremes-v1"),
  dates: z.array(z.string()).length(365),
  period: z.array(z.string()).length(2),
  classification: z.string(),
  limitations: z.array(z.string()),
  profiles: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      reason: z.string().optional(),
      source_url: z.string().url(),
      sha256: z.string().optional(),
      retrieved_at: z.string().optional(),
      variables: z.record(
        z.string(),
        z.object({
          unit: z.string(),
          long_name: z.string(),
          values: z.array(nullable).length(365),
          valid_days: finite,
          min: nullable,
          max: nullable,
          p05: nullable,
          p95: nullable,
        }),
      ),
    }),
  ),
});
export type DailyExtremes = z.infer<typeof dailyExtremesSchema>;

function positive(name: string, v: number) {
  if (!Number.isFinite(v) || v <= 0)
    throw Error(`${name} must be positive and finite.`);
}
function bounded(name: string, v: number, low: number, high: number) {
  if (!Number.isFinite(v) || v < low || v > high)
    throw Error(`${name} must be between ${low} and ${high}.`);
}
export function compositionClosure(values: (number | null)[], tolerance = 5) {
  bounded("Closure tolerance", tolerance, 0, 100);
  values.forEach((v) => {
    if (v !== null) bounded("Reported percentage", v, 0, 100);
  });
  const total = values.reduce<number>((sum, v) => sum + (v ?? 0), 0),
    complete = values.length > 0 && values.every((v) => v !== null);
  return {
    complete,
    total,
    closurePass: complete ? Math.abs(total - 100) <= tolerance : null,
    normalized:
      complete && total > 0 ? values.map((v) => (100 * v!) / total) : null,
    interpretation:
      "Mass closure is a quality check under a declared tolerance, not mineral identification or a planetary analogy.",
  };
}

/** NOAA fractional-year declination; true solar hour is an input, not civil time. */
export function earthSolar(latitude: number, day: number, solarHour: number) {
  bounded("Latitude", latitude, -90, 90);
  bounded("Day of 2025", day, 1, 365);
  bounded("True solar hour", solarHour, 0, 24);
  const g = ((2 * Math.PI) / 365) * (day - 1 + (solarHour - 12) / 24);
  const d =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const p = (latitude * Math.PI) / 180,
    h = ((solarHour - 12) * Math.PI) / 12;
  const elevation =
    (Math.asin(
      Math.max(
        -1,
        Math.min(
          1,
          Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(h),
        ),
      ),
    ) *
      180) /
    Math.PI;
  const azimuth =
    ((Math.atan2(
      Math.sin(h),
      Math.cos(h) * Math.sin(p) - Math.tan(d) * Math.cos(p),
    ) *
      180) /
      Math.PI +
      180) %
    360;
  return {
    elevation,
    azimuth,
    declination: (d * 180) / Math.PI,
    cosineOnHorizontal: Math.max(0, Math.sin((elevation * Math.PI) / 180)),
  };
}

export function resourceRecovery(
  bulkKg: number,
  waterPercent: number,
  recoveryPercent: number,
  reportedSpreadPercent: number | null = null,
) {
  positive("Bulk sample mass", bulkKg);
  bounded("Water mass percentage", waterPercent, 0, 100);
  bounded("Recovery efficiency", recoveryPercent, 0, 100);
  if (reportedSpreadPercent !== null)
    bounded("Reported spread", reportedSpreadPercent, 0, 100);
  const f = (bulkKg * recoveryPercent) / 10000;
  return {
    recoveredKg: f * waterPercent,
    rangeKg:
      reportedSpreadPercent === null
        ? null
        : [
            f * Math.max(0, waterPercent - reportedSpreadPercent),
            f * Math.min(100, waterPercent + reportedSpreadPercent),
          ],
    classification: "SCENARIO MASS BALANCE",
    reserveEstimate: null,
  };
}

/** Shao & Lu2000 Eq24, literal rho_p/rho_air form; dry, bare, loose spherical grains. */
export function dustThreshold(
  density: number,
  particleDensity: number,
  gravity: number,
  diameterM: number,
  gamma = 0.0003,
) {
  if (density === 0) return null;
  positive("Gas density", density);
  positive("Particle density", particleDensity);
  positive("Gravity", gravity);
  positive("Particle diameter", diameterM);
  bounded("Cohesion parameter", gamma, 0, 0.1);
  return Math.sqrt(
    0.0123 *
      ((particleDensity / density) * gravity * diameterM +
        gamma / (density * diameterM)),
  );
}
export function frictionVelocity10m(wind: number, roughnessM: number) {
  bounded("Scenario 10 m wind", wind, 0, 500);
  positive("Roughness length", roughnessM);
  if (roughnessM >= 10)
    throw Error("Roughness must be below 10 m reference height.");
  return (0.4 * wind) / Math.log(10 / roughnessM);
}
export function parseReplicates(raw: string) {
  if (!raw.trim()) return [];
  return raw.split(/[,;\n]+/).map((t) => {
    if (!t.trim()) throw Error("Empty replicate entry.");
    const v = Number(t);
    if (!Number.isFinite(v)) throw Error("Replicates must be finite numbers.");
    return v;
  });
}
export function assayQuality(
  samples: number[],
  blanks: number[],
  positiveMeasured: number | null,
  positiveExpected: number | null,
  k = 3,
  recoveryTolerance = 0.2,
) {
  bounded("Blank multiplier", k, 0, 10);
  bounded("Recovery tolerance", recoveryTolerance, 0, 1);
  if ([...samples, ...blanks].some((v) => !Number.isFinite(v)))
    throw Error("Invalid assay input.");
  if (
    samples.length < 2 ||
    blanks.length < 3 ||
    positiveMeasured === null ||
    positiveExpected === null
  )
    return {
      state: "incomplete" as const,
      reason:
        "Enter at least 2 sample replicates, 3 blanks and a positive-control measured/expected response. No biological result is inferred.",
    };
  positive("Positive-control expected increment", positiveExpected);
  if (!Number.isFinite(positiveMeasured))
    throw Error("Invalid positive-control response.");
  const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / x.length;
  const blankMean = mean(blanks),
    sampleMean = mean(samples),
    blankSd = Math.sqrt(
      blanks.reduce((a, b) => a + (b - blankMean) ** 2, 0) /
        (blanks.length - 1),
    );
  const threshold = blankMean + k * blankSd,
    recovery = (positiveMeasured - blankMean) / positiveExpected;
  const controlsPass = Math.abs(recovery - 1) <= recoveryTolerance;
  return {
    state: "assessed" as const,
    blankMean,
    sampleMean,
    blankSd,
    threshold,
    backgroundCorrected: sampleMean - blankMean,
    recovery,
    controlsPass,
    signalAboveThreshold: controlsPass ? sampleMean > threshold : null,
    interpretation:
      "Declared linear-signal QC screen. Blank variability, control recovery and signal thresholds do not establish life, sterility, habitability or assay specificity.",
  };
}

export function caveStations(
  lengthM: number,
  spacingM: number,
  speedMps: number,
  dwellMinutes: number,
) {
  positive("Proposed traverse length", lengthM);
  positive("Station spacing", spacingM);
  positive("Scenario walking speed", speedMps);
  bounded("Station dwell", dwellMinutes, 0, 120);
  const n = Math.ceil(lengthM / spacingM);
  if (n > 500)
    throw Error("Use a larger station spacing (maximum 501 proposed stations).");
  const stations = Array.from({ length: n + 1 }, (_, i) => ({
    label: `C${i + 1}`,
    distanceFromSurveyedOriginM: Math.min(i * spacingM, lengthM),
    absoluteCoordinates: null,
  }));
  return {
    stations,
    oneWayMinutes: lengthM / speedMps / 60 + stations.length * dwellMinutes,
    classification: "PROPOSED RELATIVE STATIONS",
    geojson: null,
  };
}

type HeapItem = [number, number];
class MinHeap {
  items: HeapItem[] = [];
  push(value: HeapItem) {
    let i = this.items.push(value) - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p][0] <= value[0]) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = value;
  }
  pop() {
    const root = this.items[0],
      last = this.items.pop()!;
    if (this.items.length) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let c = i * 2 + 1;
        if (
          c + 1 < this.items.length &&
          this.items[c + 1][0] < this.items[c][0]
        )
          c++;
        if (this.items[c][0] >= last[0]) break;
        this.items[i] = this.items[c];
        i = c;
      }
      this.items[i] = last;
    }
    return root;
  }
}
export function terrainRoute(
  grid: (number | null)[][],
  spacingM: number,
  start: number,
  end: number,
  maxSlopeDeg: number,
  penalty: number,
) {
  positive("Sample spacing", spacingM);
  bounded("Slope constraint", maxSlopeDeg, 0.1, 80);
  bounded("Slope cost", penalty, 0, 100);
  const n = grid.length;
  if (n < 2 || grid.some((row) => row.length !== n))
    throw Error("Square measured grid required.");
  const values = grid.flat(),
    valid = (i: number) =>
      i >= 0 &&
      i < values.length &&
      values[i] !== null &&
      Number.isFinite(values[i]);
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    !valid(start) ||
    !valid(end)
  )
    return {
      status: "unavailable" as const,
      reason:
        "Start/end must be valid measured land nodes; no point was substituted.",
    };
  const costs = new Float64Array(n * n).fill(Infinity),
    parent = new Int32Array(n * n).fill(-1),
    heap = new MinHeap();
  costs[start] = 0;
  heap.push([0, start]);
  while (heap.items.length) {
    const [cost, i] = heap.pop();
    if (cost !== costs[i]) continue;
    if (i === end) break;
    const r = Math.floor(i / n),
      c = i % n;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const y = r + dy,
          x = c + dx;
        if (y < 0 || y >= n || x < 0 || x >= n) continue;
        const j = y * n + x;
        if (!valid(j)) continue;
        if (dx && dy && (!valid(r * n + x) || !valid(y * n + c))) continue;
        const distance = spacingM * Math.hypot(dx, dy),
          slope =
            (Math.atan(Math.abs(values[j]! - values[i]!) / distance) * 180) /
            Math.PI;
        if (slope > maxSlopeDeg) continue;
        const next =
          cost + distance * (1 + penalty * (slope / maxSlopeDeg) ** 2);
        if (next < costs[j]) {
          costs[j] = next;
          parent[j] = i;
          heap.push([next, j]);
        }
      }
  }
  if (!Number.isFinite(costs[end]))
    return {
      status: "unavailable" as const,
      reason:
        "No connected path meets these sampled-edge constraints. This is not proof that no field route exists.",
    };
  const path: number[] = [];
  for (let i = end; i !== -1; i = parent[i]) path.push(i);
  path.reverse();
  let lengthM = 0,
    ascentM = 0,
    descentM = 0,
    maxEdgeSlopeDeg = 0;
  for (let k = 1; k < path.length; k++) {
    const i = path[k - 1],
      j = path[k],
      d =
        spacingM *
        Math.hypot(Math.floor(j / n) - Math.floor(i / n), (j % n) - (i % n)),
      dz = values[j]! - values[i]!;
    lengthM += d;
    ascentM += Math.max(0, dz);
    descentM += Math.max(0, -dz);
    maxEdgeSlopeDeg = Math.max(
      maxEdgeSlopeDeg,
      (Math.atan(Math.abs(dz) / d) * 180) / Math.PI,
    );
  }
  return {
    status: "available" as const,
    path,
    lengthM,
    ascentM,
    descentM,
    maxEdgeSlopeDeg,
    modelCost: costs[end],
    classification: "PROPOSED GRAPH ROUTE / NOT FIELD CLEARED",
  };
}
export function routeCoordinates(
  latitude: number,
  longitude: number,
  row: number,
  col: number,
  n: number,
  spacing: number,
) {
  const east = (col - (n - 1) / 2) * spacing,
    north = ((n - 1) / 2 - row) * spacing,
    d = Math.hypot(east, north),
    p = (latitude * Math.PI) / 180,
    l = (longitude * Math.PI) / 180,
    a = d / 6371000,
    b = Math.atan2(east, north);
  if (!d) return [longitude, latitude];
  const q = Math.asin(
    Math.sin(p) * Math.cos(a) + Math.cos(p) * Math.sin(a) * Math.cos(b),
  );
  return [
    ((((l +
      Math.atan2(
        Math.sin(b) * Math.sin(a) * Math.cos(p),
        Math.cos(a) - Math.sin(p) * Math.sin(q),
      )) *
      180) /
      Math.PI +
      540) %
      360) -
      180,
    (q * 180) / Math.PI,
  ];
}
export function baseTradeoffs(
  sites: IlluminationSite[],
  solarWeight: number,
  slopeScale: number,
  minSun: number,
  maxDarkHours: number,
) {
  bounded("Solar weight", solarWeight, 0, 1);
  positive("Slope scale", slopeScale);
  bounded("Minimum sampled visibility", minSun, 0, 1);
  positive("Maximum sampled dark run", maxDarkHours);
  return sites
    .map((site) => ({
      id: site.id,
      name: site.name,
      solar: site.summary.visible_fraction,
      terrain: Math.max(0, 1 - site.p90_slope_deg / slopeScale),
      darkHours: site.summary.max_sampled_dark_run_hours,
      eligible:
        site.summary.visible_fraction >= minSun &&
        site.summary.max_sampled_dark_run_hours <= maxDarkHours,
      index:
        100 *
        (solarWeight * site.summary.visible_fraction +
          (1 - solarWeight) * Math.max(0, 1 - site.p90_slope_deg / slopeScale)),
      resourceAbundance: null,
      engineeringAccess: null,
    }))
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        b.index - a.index ||
        a.id.localeCompare(b.id),
    );
}
export function autonomyWh(
  loadW: number,
  darkHours: number,
  usableFraction: number,
) {
  positive("Load", loadW);
  bounded("Dark-run hours", darkHours, 0, 8760);
  bounded("Usable battery fraction", usableFraction, 0.01, 1);
  return (loadW * darkHours) / usableFraction;
}
