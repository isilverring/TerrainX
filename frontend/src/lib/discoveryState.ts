import type { SortKey } from "./data";

/** Atlas-only query keys cannot collide with another workspace's filters. */
export const ATLAS_KEYS = [
  "atlas_region",
  "atlas_q",
  "atlas_coverage",
  "atlas_sort",
  "atlas_id",
  "atlas_compare",
] as const;

export function discoveryFilters(
  params: URLSearchParams,
  regions: readonly string[],
) {
  const region = params.get("atlas_region") ?? "all";
  const sort = params.get("atlas_sort");
  return {
    region: regions.includes(region) ? region : "all",
    query: params.get("atlas_q") ?? "",
    sufficient: params.get("atlas_coverage") === "70",
    sortKey: (["U", "C", "F", "P"].includes(sort ?? "")
      ? sort
      : "U") as SortKey,
  };
}

/** A comparison contains distinct sites present in this active collection. */
export function comparisonIds(
  raw: string,
  available: readonly string[],
  maximum = 3,
) {
  const valid = new Set(available);
  return [...new Set(raw.split(",").filter((id) => valid.has(id)))].slice(
    0,
    maximum,
  );
}

export function resetDiscoveryFilters(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  for (const key of ["atlas_region", "atlas_q", "atlas_coverage"])
    next.delete(key);
  return next;
}
