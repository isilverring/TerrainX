import { z } from "zod";
import type { Dataset, Mission } from "./models";
import { validScenario } from "./scoring";
import type { Scenario } from "./counterfactual";
const scenario = z.custom<Scenario>(validScenario, "Unsupported mission model");
export const snapshotSchema = z.object({
  snapshot_version: z.literal("1.0"),
  collection: z.enum(["original", "expanded"]).optional(),
  target_reference: z
    .string()
    .regex(/^lunar-polar:[a-z0-9-]+$/)
    .optional(),
  proposal_protocol: z.literal("site-evidence").optional(),
  title: z.string().min(1).max(120),
  created_at: z.string().datetime(),
  science: z.object({
    release_id: z.string().regex(/^science-[a-f0-9]{16}$/),
    dataset_sha256: z.string().regex(/^[a-f0-9]{64}$/),
    model_version: z.literal("terrainx-model-v1"),
  }),
  mission: z.enum(["jezero", "mare-crisium"]),
  candidate_id: z.string().nullable(),
  comparison_ids: z.array(z.string()).max(3),
  scenarios: z.object({ jezero: scenario, "mare-crisium": scenario }),
});
export type ResearchSnapshot = z.infer<typeof snapshotSchema>;
export function makeSnapshot(
  data: Dataset,
  scenarios: Record<Mission, Scenario>,
  mission: Mission,
  candidateId: string | null,
  title: string,
  comparisons: string[] = [],
) {
  if (!data.release)
    throw new Error("A validated science release is required before saving");
  if (data.target_reference && mission !== "mare-crisium")
    throw Error("A lunar polar reference cannot be saved as a Mars mission.");
  if (candidateId && !data.candidates.some((c) => c.id === candidateId))
    throw new Error("Candidate is outside this release");
  return snapshotSchema.parse({
    snapshot_version: "1.0",
    collection: data.collection ?? "original",
    target_reference: data.target_reference,
    proposal_protocol: data.proposal_protocol,
    title,
    created_at: new Date().toISOString(),
    science: data.release,
    mission,
    candidate_id: candidateId,
    comparison_ids: comparisons
      .filter((id) => data.candidates.some((c) => c.id === id))
      .slice(0, 3),
    scenarios,
  });
}
export function snapshotLink(snapshot: ResearchSnapshot) {
  const params = new URLSearchParams({
    cohort: snapshot.collection ?? "original",
    mission: snapshot.mission,
    science: snapshot.science.release_id,
    datahash: snapshot.science.dataset_sha256,
    model: JSON.stringify(snapshot.scenarios[snapshot.mission]),
  });
  params.set(
    "polar",
    snapshot.target_reference
      ? snapshot.target_reference.replace("lunar-polar:", "")
      : "none",
  );
  return `#/${snapshot.candidate_id ? `site/${snapshot.candidate_id}` : "explorer"}?${params}`;
}
export function checkSnapshotRelease(
  snapshot: ResearchSnapshot,
  data: Dataset,
) {
  if (snapshot.target_reference !== data.target_reference)
    throw Error(
      "Saved planetary reference differs from the active target. Reopen its pinned link; no target substituted.",
    );
  if (
    snapshot.science.release_id !== data.release?.release_id ||
    snapshot.science.dataset_sha256 !== data.release?.dataset_sha256
  )
    throw new Error(
      "This study requires a different immutable science release; no newer data were substituted.",
    );
  if (
    snapshot.candidate_id &&
    !data.candidates.some((c) => c.id === snapshot.candidate_id)
  )
    throw new Error("Saved candidate is absent from the pinned release");
}
const KEY = "terrainx-research-snapshots-v1";
export function savedSnapshots(): ResearchSnapshot[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(saved)
      ? saved
          .map((x) => snapshotSchema.safeParse(x))
          .filter((x) => x.success)
          .map((x) => x.data!)
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export function persistSnapshots(snapshots: ResearchSnapshot[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshots.slice(0, 20)));
    return true;
  } catch {
    return false;
  }
}
