import { z } from "zod";
const provenance = z
  .object({
    source_url: z.string(),
    retrieved_at: z.string(),
    dataset: z.string().optional(),
    original_unit: z.string().optional(),
    classification: z.string().optional(),
    period: z
      .union([z.string(), z.array(z.union([z.string(), z.number()]))])
      .nullable()
      .optional(),
  })
  .passthrough();
export const metricsSchema = z
  .object({
    median_slope_deg: z.number(),
    p90_slope_deg: z.number(),
    relief_m: z.number(),
    relative_relief: z.number(),
    detrended_rms_m: z.number(),
    valid_samples: z.number(),
    sample_spacing_m: z.number(),
    footprint_m: z.number(),
    gradient_baseline_m: z.number(),
  })
  .passthrough();
const terrain = z
  .object({
    status: z.string(),
    reason: z.string().optional(),
    elevations_m: z.array(z.array(z.number().nullable())).nullable().optional(),
    metrics: metricsSchema.optional(),
    sample_spacing_m: z.number().optional(),
    footprint_m: z.number().optional(),
    native_resolution_m: z.object({ x: z.number(), y: z.number() }).optional(),
    resampling: z.string().optional(),
    provenance: z.array(provenance).optional(),
  })
  .passthrough();
const observation = z.object({
  value: z.number().nullable(),
  monthly: z.array(z.number().nullable()).length(12),
  unit: z.string(),
  long_name: z.string(),
  provenance,
});
const climate = z.object({
  PRECTOTCORR: observation.optional(),
  T2M: observation.optional(),
  WS10M: observation.optional(),
  ALLSKY_SFC_SW_DWN: observation.optional(),
  PS: observation.optional(),
  RH2M: observation.optional(),
  annual_precip_mm: z.number().nullable().optional(),
  seasonal_temperature_range_c: z.number().nullable().optional(),
});
const criterion = z.object({
  value: z.number().min(0).max(1).nullable(),
  rationale: z.string(),
  source_refs: z.array(z.string()),
  classification: z.string(),
});
const realityGap = z.object({
  match: z.array(z.string()),
  mission_use: z.string(),
  mismatch: z.array(z.string()),
  missing: z.array(z.string()),
  force_model: z.string(),
  conclusion: z.string(),
});
const experiment = z.object({
  hypothesis: z.string(),
  objective: z.string(),
  why_useful: z.string(),
  equipment: z.array(z.string()),
  measurements: z.array(z.string()),
  success_indicator: z.string(),
  next_measurement: z.string(),
  unvalidated: z.string(),
  cannot_reproduce: z.array(z.string()),
  evidence_gate: z.string(),
  classification: z.string(),
});
const assessment = z.object({
  utility: z.object({
    value: z.number().nullable(),
    coverage: z.number().min(0).max(1),
    weights: z.record(z.string(), z.number()),
    criteria: z.record(z.string(), criterion),
    status: z.string(),
    evidence_label: z.string(),
    note: z.string(),
  }),
  fidelity: z.object({
    value: z.number().nullable(),
    reason: z.string().nullable(),
    warning: z.string().optional(),
    components: z.array(
      z.object({
        feature: z.string(),
        earth: z.number(),
        planet: z.number(),
        tolerance: z.number(),
        similarity: z.number(),
        weight: z.number(),
      }),
    ),
  }),
  priority: z.number().nullable(),
  alpha: z.number(),
  gamma: z.number(),
  minimum_coverage: z.number().optional(),
  reality_gap: realityGap,
  experiment,
});
export const candidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  region_id: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  benchmark: z.boolean(),
  status: z.enum([
    "REFERENCE ANALOG",
    "SCREENED CANDIDATE",
    "CHARACTERIZED CANDIDATE",
  ]),
  climate,
  terrain,
  geology: z
    .object({
      status: z.string(),
      units: z.array(z.record(z.string(), z.unknown())),
      source_refs: z.array(z.string()),
      caution: z.string().optional(),
    })
    .passthrough(),
  assessments: z.object({ jezero: assessment, "mare-crisium": assessment }),
  source_refs: z.array(z.string()),
  coordinate_scope: z.string().optional(),
  material_process: z.string().optional(),
  limits: z.array(z.string()).optional(),
});
export const targetSchema = z
  .object({
    id: z.enum(["jezero", "mare-crisium"]),
    body: z.string(),
    name: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    mission: z.string(),
    context: z.string(),
    terrain,
    source_refs: z.array(
      z.object({ title: z.string(), url: z.string() }).passthrough(),
    ),
  })
  .passthrough();
export const datasetSchema = z.object({
  collection: z.enum(["original", "expanded"]).optional(),
  active_mission: z.enum(["jezero", "mare-crisium"]).optional(),
  release: z
    .object({
      release_id: z.string(),
      model_version: z.string(),
      dataset_sha256: z.string(),
      source_data_commit: z.string(),
      files: z.record(
        z.string(),
        z.object({ sha256: z.string(), bytes: z.number() }),
      ),
    })
    .optional(),
  schema_version: z.literal("1.0"),
  generated_at: z.string(),
  regions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      bounds: z.array(z.number()),
      rationale: z.string(),
    }),
  ),
  candidates: z.array(candidateSchema).min(1),
  targets: z.array(targetSchema),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
      organization: z.string(),
    }),
  ),
  summary: z.object({
    screened_cells: z.number(),
    valid_screened_cells: z.number(),
    shortlisted_candidates: z.number(),
    characterized_candidates: z.number(),
    benchmark_sites: z.number(),
    climate_profiles: z.number(),
    terrain_profiles: z.number(),
    planetary_profiles: z.number(),
    geology_mapped: z.number(),
    errors: z.array(z.unknown()),
  }),
  config: z.object({ ranking: z.string() }).passthrough(),
});
export type Dataset = z.infer<typeof datasetSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type Target = z.infer<typeof targetSchema>;
export type Metrics = z.infer<typeof metricsSchema>;
export type Assessment = z.infer<typeof assessment>;
export type Mission = "jezero" | "mare-crisium";
export type Observation = z.infer<typeof observation>;
// Named scientific entities used by the static dataset and dossier views.
export type PlanetaryTarget = Target;
export type EarthStudyRegion = Dataset["regions"][number];
export type EarthCandidate = Candidate;
export type ReferenceAnalog = Candidate & { benchmark: true };
export type NASAObservation = Observation;
export type TerrainProfile = Candidate["terrain"];
export type GeologicalEvidence = Candidate["geology"];
export type SimilarityResult = Assessment["fidelity"];
export type MissionUtilityResult = Assessment["utility"];
export type EvidenceCoverage = MissionUtilityResult["coverage"];
export type CandidateAssessment = Assessment;
export type RealityGap = Assessment["reality_gap"];
export type FieldExperiment = Assessment["experiment"];
export type AnalogPassport = {
  candidate: Candidate;
  target: Target;
  assessment: Assessment;
  generatedAt: string;
};
export type SourceReference = Dataset["sources"][number];
export interface ScreenedGridCell {
  id: string;
  region_id: string;
  latitude: number;
  longitude: number;
  annual_precip_mm: number | null;
  aridity: number | null;
  land_eligible: boolean;
  provenance: Record<string, unknown>;
}
