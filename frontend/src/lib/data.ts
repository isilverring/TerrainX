import { createContext, useContext } from "react";
import { readScienceRelease, releaseFromHash } from "./release";
import type { Dataset, Candidate, Mission } from "./models";
export const DataContext = createContext<Dataset | null>(null);
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error("Scientific dataset is not loaded");
  return data;
}
const requests = new Map<string, Promise<Dataset>>();
export function loadData(id = releaseFromHash()) {
  const key = id ?? "latest";
  if (!requests.has(key))
    requests.set(
      key,
      readScienceRelease(id).catch((error) => {
        requests.delete(key);
        throw error;
      }),
    );
  return requests.get(key)!.then((data) => {
    const expected = new URLSearchParams(
      window.location.hash.split("?")[1],
    ).get("datahash");
    if (expected && expected !== data.release?.dataset_sha256)
      throw new Error(
        "Saved study dataset hash does not match the requested release. No results substituted.",
      );
    return data;
  });
}
export function number(value: number | null | undefined, digits = 1) {
  return value == null
    ? "—"
    : value.toLocaleString("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
}
export function coordinates(c: Candidate) {
  return `${Math.abs(c.latitude).toFixed(3)}° ${c.latitude >= 0 ? "N" : "S"}  /  ${Math.abs(c.longitude).toFixed(3)}° ${c.longitude >= 0 ? "E" : "W"}`;
}
export type SortKey = "U" | "C" | "F" | "P";
export const sortLabels: Record<SortKey, string> = {
  U: "Mission utility U",
  C: "Evidence coverage C",
  F: "Terrain fidelity F",
  P: "Combined priority P",
};
function sortValue(c: Candidate, mission: Mission, key: SortKey) {
  const a = c.assessments[mission];
  switch (key) {
    case "U":
      return a.utility.value;
    case "C":
      return 100 * a.utility.coverage;
    case "F":
      return a.fidelity.value;
    case "P":
      return a.priority;
  }
}
/** Evidence tier: characterized candidates before screened ones, so a partial U
 * computed from 45 % of the criterion weight never outranks a fully assessed U. */
export function evidenceTier(c: Candidate, mission: Mission) {
  const status = c.assessments[mission].utility.status;
  return status === "CHARACTERIZED CANDIDATE" ||
    (c.benchmark && c.assessments[mission].utility.coverage >= 0.7)
    ? 0
    : 1;
}
/** Deterministic ranking. Null values (not assessed) always sort last; they are
 * never treated as zero-valued scores. */
export function rankCandidates(
  candidates: Candidate[],
  mission: Mission,
  key: SortKey = "U",
  grouped = true,
) {
  return [...candidates].sort((a, b) => {
    if (grouped) {
      const tier = evidenceTier(a, mission) - evidenceTier(b, mission);
      if (tier) return tier;
    }
    const va = sortValue(a, mission, key),
      vb = sortValue(b, mission, key);
    if (va == null && vb != null) return 1;
    if (vb == null && va != null) return -1;
    return (
      (vb ?? 0) - (va ?? 0) ||
      b.assessments[mission].utility.coverage -
        a.assessments[mission].utility.coverage ||
      (b.assessments[mission].utility.value ?? -1) -
        (a.assessments[mission].utility.value ?? -1) ||
      a.id.localeCompare(b.id)
    );
  });
}
/** localStorage can throw in private or embedded contexts; storage is optional. */
export const safeStorage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* Storage is a convenience only. */
    }
  },
};
export const labels = {
  median_slope_deg: "Median slope",
  p90_slope_deg: "90th percentile slope",
  relief_m: "Regional relief Q95−Q05",
  detrended_rms_m: "Detrended RMS roughness",
} as const;
export const metricUnits = {
  median_slope_deg: "°",
  p90_slope_deg: "°",
  relief_m: "m",
  detrended_rms_m: "m",
} as const;
export function statusName(status: string) {
  return status.toLowerCase().replaceAll("_", " ");
}
