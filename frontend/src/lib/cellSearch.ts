import { z } from "zod";

const num = z.number().nullable();
const metrics = z
  .object({ median_slope_deg: z.number(), p90_slope_deg: z.number(), relief_m: z.number(), detrended_rms_m: z.number() })
  .passthrough();
const missionResult = z.object({
  F: num,
  U: num,
  C: z.number(),
  P: num,
  reason: z.string().nullable(),
  rank: z.number().int().nullable(),
  criteria: z.record(z.string(), num),
  geology_rationale: z.string(),
});
export const cellRowSchema = z.object({
  id: z.string(),
  region_id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  annual_precip_mm: num,
  aridity: num,
  released_candidate: z.boolean(),
  terrain: z.object({
    status: z.string(),
    reason: z.string().nullable().optional(),
    elevations_m: z.array(z.array(num)).nullable().optional(),
    metrics: metrics.nullable().optional(),
  }),
  geology: z.object({
    status: z.string().nullable(),
    unit_name: z.string().nullable(),
    lith: z.string().nullable(),
    age: z.string().nullable().optional(),
    map_id: z.number().nullable().optional(),
    source_id: z.number().nullable().optional(),
    source_refs: z.array(z.string()),
  }),
  missions: z.record(z.string(), missionResult),
  climate: z.record(z.string(), num).nullable().optional(),
  environment: z
    .object({
      warmest_month_max_c: num,
      coldest_month_min_c: num,
      annual_span_c: num,
      frost_days_per_year: num,
      soil_wetness_top: num,
      soil_wetness_root: num,
      aerosol_optical_depth_550: num,
      period: z.string().nullable().optional(),
      source_url: z.string(),
      sha256: z.string(),
    })
    .passthrough()
    .nullable()
    .optional(),
  biology: z
    .object({ gbif_occurrences: z.number(), per_1000_km2: z.number(), cell_area_km2: z.number(), source_url: z.string(), caveat: z.string() })
    .passthrough()
    .nullable()
    .optional(),
  subsurface: z
    .object({ class: z.string().nullable(), karst_units: z.array(z.string()), lava_units: z.array(z.string()), method: z.string() })
    .nullable()
    .optional(),
  mobility: z
    .object({ over_5_deg: z.number(), over_10_deg: z.number(), over_15_deg: z.number(), max_deg: z.number(), baseline_m: z.number() })
    .nullable()
    .optional(),
  dimensions: z.record(z.string(), num).optional(),
});
export const cellSearchSchema = z.object({
  contract: z.enum(["terrainx-cell-search-v1", "terrainx-cell-search-v2"]),
  generated_at: z.string(),
  cells: z.number(),
  terrain_available: z.number(),
  geology_mapped: z.number(),
  rules: z.object({ alpha: z.record(z.string(), z.number()), per_region: z.number(), separation_km: z.number(), temperature: z.string(), ranking: z.string() }),
  released_shortlist: z.array(z.string()),
  missions: z.record(
    z.string(),
    z.object({
      eligible: z.number(),
      shortlist: z.array(z.string()),
      terrain_shortlist: z.array(z.string()),
      overlap_with_release: z.array(z.string()),
      new_vs_release: z.array(z.string()),
    }),
  ),
  rows: z.array(cellRowSchema),
  dimension_definitions: z.record(z.string(), z.string()).optional(),
  provenance: z.array(z.object({ sha256: z.string(), retrieved_at: z.string(), file: z.string(), source: z.string() })),
  errors: z.array(z.unknown()),
});
export type CellSearch = z.infer<typeof cellSearchSchema>;
export type CellRow = z.infer<typeof cellRowSchema>;

/** Readable cell label from its id, e.g. "chile--23.000--70.000" → "23.00°S 70.00°W". */
export function cellLabel(c: { latitude: number; longitude: number }) {
  const ns = c.latitude < 0 ? "S" : "N",
    ew = c.longitude < 0 ? "W" : "E";
  return `${Math.abs(c.latitude).toFixed(2)}°${ns} ${Math.abs(c.longitude).toFixed(3)}°${ew}`;
}

export const DIMENSION_LABELS: Record<string, string> = {
  soil_dryness: "Soil dryness",
  thermal_extremes: "Thermal extremes",
  dust_loading: "Dust loading",
  life_scarcity: "Life scarcity",
  rugged_terrain: "Rugged terrain",
};
