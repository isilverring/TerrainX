import {z} from "zod";
export const siteEvidenceSchema=z.object({schema_version:z.literal("1.0"),reviewed_at:z.string(),source_sha256:z.string(),score_policy:z.string(),cases:z.array(z.object({
 candidate_id:z.string(),mission:z.enum(["jezero","mare-crisium"]),title:z.string(),subsite:z.string().nullable(),classification:z.string(),supported:z.string(),contradiction:z.string(),scope:z.string(),next_measurement:z.string(),candidate_center:z.object({latitude:z.number(),longitude:z.number()}),
 sources:z.array(z.object({id:z.string(),title:z.string(),url:z.string().url(),doi:z.string().url(),geographic_scope:z.string(),accessed_at:z.string()})),
 reported_points:z.array(z.object({id:z.string(),latitude:z.number(),longitude:z.number(),material:z.string(),source_id:z.string(),source_url:z.string().url(),coordinate_datum:z.string(),classification:z.string(),derived_scope:z.object({distance_from_center_km:z.number(),east_m:z.number(),north_m:z.number(),within_approximate_analysis_window:z.boolean(),classification:z.literal("DERIVED"),method:z.string()})})),
 experiment:z.object({hypothesis:z.string(),objective:z.string(),equipment:z.array(z.string()),procedure:z.array(z.string()),success_indicator:z.string(),unvalidated:z.string(),cannot_reproduce:z.string()})
}))});
export type SiteEvidence=z.infer<typeof siteEvidenceSchema>["cases"][number];
