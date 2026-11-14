import { z } from "zod";
import { candidateSchema, type Candidate, type Dataset } from "./models";
export const fieldSitesSchema = z.object({
  contract: z.literal("terrainx-field-sites-v1"),
  candidates: z.array(candidateSchema),
});
export type Collection = "original" | "expanded";
/** Fixed imagery/search/utility studies cannot inherit an unrelated polar target. */
export const PRIMARY_REFERENCE_PAGES=new Set(["/cells","/cases","/frontier","/lenses","/what-if","/worlds","/terrain-pilot","/lunar-pole","/guide"]);
/** Carry identity explicitly before a destination component initializes state. */
export function studyPath(path: string, search: string) {
  const [route, query = ""] = path.split("?"),
    next = new URLSearchParams(query),
    current = new URLSearchParams(search);
  if(PRIMARY_REFERENCE_PAGES.has(route)&&!next.has("polar"))next.set("polar","none");
  for (const key of ["science", "cohort", "mission", "polar"])
    if (!next.has(key) && current.has(key)) next.set(key, current.get(key)!);
  return route + (next.size ? "?" + next : "");
}
/** Frozen original objects take precedence where the 16 baseline IDs overlap. */
export function expandedCollection(base: Dataset, extra: Candidate[]): Dataset {
  const candidates = [
    ...new Map([...extra, ...base.candidates].map((c) => [c.id, c])).values(),
  ];
  return {
    ...base,
    collection: "expanded",
    candidates,
    summary: {
      ...base.summary,
      climate_profiles: candidates.filter((c) => c.climate.T2M?.value != null)
        .length,
      terrain_profiles: candidates.filter(
        (c) => c.terrain.status === "available",
      ).length,
      geology_mapped: candidates.filter((c) => c.geology.status === "mapped")
        .length,
    },
  };
}
