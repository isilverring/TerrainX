import { z } from "zod";
const metric = z.object({
  median_slope_deg: z.number().finite(),
  p90_slope_deg: z.number().finite(),
  relief_m: z.number().nonnegative(),
  detrended_rms_m: z.number().nonnegative(),
  valid_samples: z.number().int(),
  gradient_baseline_m: z.literal(8000),
});
const profile = z.object({
  status: z.enum(["available", "unavailable"]),
  elevations_m: z
    .array(z.array(z.number().finite().nullable()).length(7))
    .length(7),
  metrics: metric.nullable(),
  minimum_coverage: z.number().min(0).max(1.000001),
  support_m: z.number().positive(),
  footprint_m: z.literal(24000),
  contributing_width_m: z.number().positive(),
});
const score = z.object({
  value: z.number().min(0).max(100).nullable(),
  reason: z.string().nullable(),
});
const source = z.object({
  url: z.string().url(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().positive(),
  kind: z.string(),
  relative_path: z.string(),
});
export const pilotSchema = z.object({
  schema_version: z.literal("1.0"),
  model: z.literal("terrainx-support-pilot-v1"),
  classification: z.string(),
  limitations: z.array(z.string()),
  source_manifest: z.object({
    doi: z.string().url(),
    registry_url: z.string().url(),
    official_collection_url: z.string().url(),
  }),
  results: z
    .array(
      z.object({
        candidate_id: z.string(),
        candidate_name: z.string(),
        benchmark: z.boolean(),
        latitude: z.number(),
        longitude: z.number(),
        mission: z.enum(["jezero", "mare-crisium"]),
        target: z.string(),
        original_srtm_fidelity: z.number().nullable(),
        partner_point_baseline: z.object({ value: z.number().nullable() }),
        planet_native_resolution_m: z.number().positive(),
        planet_source: z.object({ url: z.string().url(), sha256: z.string() }),
        earth_sources: z.array(source),
        scenarios: z
          .array(
            z.object({
              support_m: z.number(),
              offset: z.enum(["center", "east", "west", "north", "south"]),
              earth: profile,
              planet: profile,
              fidelity: score,
              quadrature_check: z
                .object({
                  fine_working_cell_m: z.literal(500),
                  fidelity: z.number().nullable(),
                  absolute_score_delta: z.number().nonnegative().nullable(),
                })
                .optional(),
              earth_quality_fractions: z
                .record(z.string(), z.number().min(0).max(1.000001))
                .optional(),
            }),
          )
          .length(10),
      }),
    )
    .length(4),
});
export type Pilot = z.infer<typeof pilotSchema>;
export function pilotRange(scenarios: Pilot["results"][number]["scenarios"]) {
  const values = scenarios.flatMap((s) =>
    s.fidelity.value === null ? [] : [s.fidelity.value],
  );
  return values.length
    ? { min: Math.min(...values), max: Math.max(...values) }
    : null;
}
