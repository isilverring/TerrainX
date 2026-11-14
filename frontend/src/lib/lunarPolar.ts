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
    }),
  ),
});
export type LunarPolar = z.infer<typeof lunarPolarSchema>;

/** South-polar azimuthal-equidistant projection: pole at centre, 0° longitude up, east clockwise. */
export function polarXY(lat: number, lon: number, radiusPx: number, maxColat: number) {
  const r = ((90 + lat) / maxColat) * radiusPx,
    a = (lon * Math.PI) / 180;
  return { x: r * Math.sin(a), y: -r * Math.cos(a) };
}
