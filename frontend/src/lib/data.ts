import { createContext, useContext } from "react";
import { datasetSchema } from "./models";
import type { Dataset, Candidate, Mission } from "./models";
export const DataContext = createContext<Dataset | null>(null);
export function useData() {
  const data = useContext(DataContext);
  if (!data) throw new Error("Scientific dataset is not loaded");
  return data;
}
let request: Promise<Dataset> | undefined;
export function loadData() {
  return (request ??= fetch("/data/dataset.json").then(async (response) => {
    if (!response.ok)
      throw new Error(`Scientific dataset returned ${response.status}`);
    const parsed = datasetSchema.safeParse(await response.json());
    if (!parsed.success)
      throw new Error(
        `Cached scientific data failed validation at ${parsed.error.issues[0].path.join(".")}. Refresh the data build.`,
      );
    return parsed.data;
  }));
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
export function rankCandidates(candidates: Candidate[], mission: Mission) {
  return [...candidates].sort(
    (a, b) =>
      (b.assessments[mission].utility.value ?? -1) -
        (a.assessments[mission].utility.value ?? -1) ||
      b.assessments[mission].utility.coverage -
        a.assessments[mission].utility.coverage ||
      a.id.localeCompare(b.id),
  );
}
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
