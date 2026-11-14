import type { Candidate, Mission, Observation } from "./models";
import { labels, metricUnits } from "./data";
export interface EvidenceFact {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  kind: string;
  scope: string;
  period: string;
  retrieved: string;
  resolution: string;
  formula?: string;
  inputs?: string;
  limitations: string[];
  sources: string[];
  hash?: string;
}
export function periodText(value: unknown): string {
  if (Array.isArray(value))
    return value
      .map((v) =>
        String(v).match(/^\d{8}$/)
          ? `${String(v).slice(0, 4)}-${String(v).slice(4, 6)}-${String(v).slice(6, 8)}`
          : String(v),
      )
      .join(" – ");
  return typeof value === "string" ? value : "Not recorded";
}
export function observationFact(
  candidate: Candidate,
  key: string,
  o: Observation,
): EvidenceFact {
  return {
    id: key,
    label: o.long_name,
    value: o.value,
    unit: o.unit,
    kind: "NASA PRODUCT",
    scope: `Query anchor ${candidate.latitude}, ${candidate.longitude}; regional grid support, not an outcrop instrument.`,
    period: periodText(o.provenance.period),
    retrieved: o.provenance.retrieved_at,
    resolution: String(o.provenance.native_resolution ?? "Not recorded"),
    hash:
      typeof o.provenance.sha256 === "string" ? o.provenance.sha256 : undefined,
    sources: [o.provenance.source_url],
    limitations: [
      "POWER combines gridded reanalysis and satellite-derived products. Available variables can share source inputs and are not independent field observations.",
      "Point coordinates do not make the gridded estimate a measurement at a particular rock.",
    ],
  };
}
export function evidenceFacts(c: Candidate, mission: Mission): EvidenceFact[] {
  const facts: EvidenceFact[] = [];
  for (const k of [
    "PRECTOTCORR",
    "T2M",
    "WS10M",
    "ALLSKY_SFC_SW_DWN",
    "PS",
    "RH2M",
  ] as const) {
    const o = c.climate[k];
    if (o) facts.push(observationFact(c, k, o));
  }
  const p = c.climate.PRECTOTCORR;
  if (p)
    facts.push({
      ...observationFact(c, "annual_precip", p),
      label: "Annual precipitation proxy",
      value: p.unit === "mm/day" ? (c.climate.annual_precip_mm ?? null) : null,
      unit: "mm/year",
      kind: "DERIVED",
      formula: "Pannual = 365.25 × Pdaily",
      inputs: `Pdaily = ${p.value ?? "unavailable"} ${p.unit}`,
      limitations: [
        "Conversion requires a valid mean daily rate in mm/day. This is an annualized climatological proxy, not a sum of actual rainfall events or planetary precipitation.",
      ],
    });
  const provenance = c.terrain.provenance ?? [];
  for (const key of Object.keys(labels) as (keyof typeof labels)[])
    facts.push({
      id: key,
      label: labels[key],
      value: c.terrain.metrics?.[key] ?? null,
      unit: metricUnits[key],
      kind: "DERIVED",
      scope: `${c.terrain.footprint_m ?? "unknown"} m terrain window around query anchor`,
      period: periodText(provenance[0]?.period),
      retrieved: provenance[0]?.retrieved_at ?? "Not recorded",
      resolution: `Native ≈90 m; sample spacing ${c.terrain.sample_spacing_m ?? "unknown"} m; slope baseline ${c.terrain.metrics?.gradient_baseline_m ?? "unknown"} m`,
      formula:
        key === "relief_m"
          ? "Q95(z) − Q05(z)"
          : key === "detrended_rms_m"
            ? "sqrt(mean((z − fitted plane)²))"
            : "atan(hypot(dz/dx,dz/dy)) in degrees; interior central differences",
      limitations: [
        "Coarse morphology cannot establish rover-scale hazards or regolith roughness.",
        "Shared sampling spacing does not eliminate unequal Earth/planet native support.",
      ],
      sources: provenance.map((p) => p.source_url),
    });
  const a = c.assessments[mission];
  facts.push({
    id: "geology",
    label: "Mission geological/process relevance",
    value: a.utility.criteria.geology.value,
    unit: "declared category 0 / 0.5 / 1",
    kind:
      a.utility.criteria.geology.value == null
        ? "UNAVAILABLE"
        : "LITERATURE-SUPPORTED",
    scope: c.benchmark
      ? (c.coordinate_scope ?? "Published benchmark context")
      : "Mapped polygon intersection at query anchor; unit exposure across the footprint is unverified",
    period: "Geologic age is not the map publication date",
    retrieved:
      typeof c.geology.retrieved_at === "string"
        ? c.geology.retrieved_at
        : "Not recorded",
    resolution:
      c.geology.units
        .map((u) => String(u.scale ?? "unknown map scale"))
        .join(" / ") || "No map",
    inputs: a.utility.criteria.geology.rationale,
    limitations: [
      c.geology.caution ??
        "Mapped lithology is not field-confirmed mineralogy.",
      "Several generalized maps may share inputs; citation count is not independent evidence count.",
      "Unknown mission relevance can coexist with known mapped lithology.",
    ],
    sources: a.utility.criteria.geology.source_refs,
  });
  return facts;
}
