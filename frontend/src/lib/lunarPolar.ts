import { z } from "zod";

const metrics = z
  .object({ median_slope_deg: z.number(), p90_slope_deg: z.number(), relief_m: z.number(), detrended_rms_m: z.number() })
  .passthrough();
export const lunarPolarSchema = z.object({
  contract: z.literal("terrainx-lunar-polar-v1"),
  generated_at: z.string(),
  raster: z.object({ url: z.string(), bytes: z.number(), sha256: z.string(), pinned_sha256: z.string(), verified_at: z.string() }),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
  caveats: z.array(z.string()),
  earth_profiles_compared: z.number(),
  sites: z.array(
    z.object({
      id: z.string(),
      feature: z.string(),
      iau_id: z.number(),
      diameter_km: z.number(),
      latitude: z.number(),
      longitude: z.number(),
      artemis_region: z.string().nullable(),
      gazetteer_url: z.string(),
      status: z.string(),
      reason: z.string().optional(),
      terrain: z
        .object({ elevations_m: z.array(z.array(z.number())), metrics, native_resolution_m: z.record(z.string(), z.number()) })
        .passthrough()
        .optional(),
      earth_twins: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            kind: z.string(),
            region_id: z.string(),
            F: z.number(),
            components: z.record(z.string(), z.number()),
            earth_metrics: metrics,
          }),
        )
        .optional(),
      earth_compared: z.number().optional(),
      diviner: z
        .object({
          triangles: z.number(),
          temp_max_k: z.object({ min: z.number(), median: z.number(), max: z.number() }),
          temp_avg_k: z.object({ min: z.number(), median: z.number(), max: z.number() }),
          cold_trap_fraction: z.number(),
          ice_surface_stable_fraction: z.number(),
          ice_stable_within_1m_fraction: z.number(),
          ice_stable_within_2_87m_fraction: z.number(),
          median_ice_depth_m: z.number().nullable(),
        })
        .nullable()
        .optional(),
    }),
  ),
  diviner: z
    .object({ product: z.string(), url: z.string(), bytes: z.number(), sha256: z.string(), label_url: z.string(), records_scanned: z.number(), radius_km: z.number(), cold_trap_threshold_k: z.number(), cold_trap_reference: z.string(), notes: z.string() })
    .nullable()
    .optional(),
  earth_coldest_cell: z.object({ cell: z.string(), coldest_month_min_c: z.number(), kelvin: z.number(), source: z.string() }).nullable().optional(),
});
export type LunarPolar = z.infer<typeof lunarPolarSchema>;

/** South-polar azimuthal-equidistant projection: pole at centre, 0° longitude up, east clockwise. */
export function polarXY(lat: number, lon: number, radiusPx: number, maxColat: number) {
  const r = ((90 + lat) / maxColat) * radiusPx,
    a = (lon * Math.PI) / 180;
  return { x: r * Math.sin(a), y: -r * Math.cos(a) };
}
