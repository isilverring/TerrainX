/**
 * Expedition Packet: one object built from the active application state, from which
 * the printable brief, JSON, CSV and GeoJSON exports are all derived. No value is
 * created here that is not already in the dataset or computed by tested functions.
 */
import type { Candidate, Dataset, Mission } from "./models";
import { utilityBounds, nextMeasurements, criterionNames } from "./frontier";
import type { CriterionKey } from "./frontier";
import { earthAtmosphere, transferGap } from "./physics";
import { squareAround } from "./mapSources";

export const APP = {
  name: "TerrainX",
  full: "Planetary Analog Discovery & Mission Readiness Lab",
  challenge:
    "2026 NASA Space Apps Challenge — Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars",
  challengeUrl:
    "https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/",
  disclaimer:
    "Independent research prototype. No field verification, NASA approval or mission-safety certification is implied.",
};

export interface PacketObservation {
  variable: string;
  name: string;
  value: number | null;
  unit: string;
  period: string | null;
  source_url: string;
  retrieved_at: string;
  classification: string;
}

export function buildPacket(
  data: Dataset,
  c: Candidate,
  mission: Mission,
  generatedAt = new Date().toISOString(),
) {
  const a = c.assessments[mission];
  const target = data.targets.find((t) => t.id === mission)!;
  const weights = a.utility.weights as Record<CriterionKey, number>;
  const bounds = utilityBounds(a.utility.criteria, weights);
  const climateKeys = [
    "T2M",
    "PRECTOTCORR",
    "WS10M",
    "ALLSKY_SFC_SW_DWN",
    "PS",
    "RH2M",
  ] as const;
  const observations: PacketObservation[] = climateKeys
    .map((k) => [k, c.climate[k]] as const)
    .filter(([, o]) => !!o)
    .map(([k, o]) => ({
      variable: k,
      name: o!.long_name,
      value: o!.value,
      unit: o!.unit,
      period: Array.isArray(o!.provenance.period)
        ? o!.provenance.period.join("–")
        : (o!.provenance.period ?? null),
      source_url: o!.provenance.source_url,
      retrieved_at: o!.provenance.retrieved_at,
      classification: "MEASURED (NASA POWER gridded climatology)",
    }));
  const atm = earthAtmosphere(c);
  return {
    packet_version: "1.0",
    app: APP,
    generated_at: generatedAt,
    reproducibility: {
      dataset_generated_at: data.generated_at,
      dataset_schema: data.schema_version,
      dataset_file: "data/dataset.json",
      model: {
        weights,
        alpha: a.alpha,
        gamma: a.gamma,
        minimum_coverage: 0.7,
        tolerances: Object.fromEntries(
          a.fidelity.components.map((x) => [x.feature, x.tolerance]),
        ),
      },
      note: "Scores reflect the model weights active when the packet was generated.",
    },
    target: {
      id: target.id,
      body: target.body,
      name: target.name,
      latitude: target.latitude,
      longitude_east: target.longitude,
      mission: target.mission,
    },
    candidate: {
      id: c.id,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      status: a.utility.status,
      benchmark: c.benchmark,
      discovery_note: c.benchmark
        ? "Documented benchmark reference; never counted as a new discovery."
        : a.utility.coverage >= 0.7
          ? "Exploratory research candidate selected algorithmically; requires field validation."
          : "Research candidate requiring validation (evidence coverage below 70%).",
      coordinate_scope:
        c.coordinate_scope ??
        "Automatically selected NASA POWER cell centre; field subsite not yet chosen.",
    },
    scores: {
      F: a.fidelity.value,
      F_reason: a.fidelity.reason,
      U: a.utility.value,
      C: a.utility.coverage,
      P: a.priority,
      fidelity_components: a.fidelity.components,
      criteria: Object.fromEntries(
        (Object.keys(criterionNames) as CriterionKey[]).map((k) => [
          k,
          {
            name: criterionNames[k],
            value: a.utility.criteria[k]?.value ?? null,
            weight: weights[k],
            classification:
              a.utility.criteria[k]?.classification ?? "UNAVAILABLE",
            rationale: a.utility.criteria[k]?.rationale ?? "",
            sources: a.utility.criteria[k]?.source_refs ?? [],
          },
        ]),
      ),
    },
    observations,
    derived_climate: {
      annual_precip_mm: c.climate.annual_precip_mm ?? null,
      seasonal_temperature_range_c:
        c.climate.seasonal_temperature_range_c ?? null,
      air_density_kg_m3: "density" in atm ? atm.density : null,
    },
    terrain: {
      status: c.terrain.status,
      metrics: c.terrain.metrics ?? null,
      sample_spacing_m: c.terrain.sample_spacing_m ?? null,
      footprint_m: c.terrain.footprint_m ?? null,
      native_resolution_m: c.terrain.native_resolution_m ?? null,
      sources: (c.terrain.provenance ?? []).map((p) => p.source_url),
      target_metrics: target.terrain.metrics ?? null,
    },
    geology: {
      status: c.geology.status,
      units: c.geology.units.map((u) => ({
        name: (u.name as string) || null,
        lithology: (u.lith as string) || null,
        age: (u.best_int_name as string) || null,
        map_id: u.map_id ?? null,
        scale: u.scale ?? null,
      })),
      caution:
        c.geology.caution ??
        "Mapped lithology is not confirmed field mineralogy.",
      sources: c.geology.source_refs,
    },
    reality_gap: a.reality_gap,
    transfer_gap: transferGap(
      mission === "jezero" ? "mars" : "moon",
      "density" in atm ? atm.density : null,
    ),
    experiment: a.experiment,
    next_measurements: {
      missing_criteria: bounds.missing,
      hypothetical_U_bounds: bounds.missing.length
        ? { min: bounds.min, max: bounds.max }
        : null,
      bounds_note:
        "Hypothetical mathematical bounds with missing criteria at 0 and 1; not predictions.",
      plans: nextMeasurements(c, mission),
    },
    sources: [
      ...data.sources.map((s) => ({
        title: s.title,
        organization: s.organization,
        url: s.url,
      })),
      ...target.source_refs.map((s) => ({
        title: s.title,
        organization: (s.organization as string) ?? "",
        url: s.url,
      })),
    ],
  };
}
export type Packet = ReturnType<typeof buildPacket>;

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** CSV of the actual numeric features in the packet (no derived prose). */
export function packetCsv(p: Packet) {
  const rows: (string | number | null)[][] = [
    ["section", "name", "value", "unit", "classification", "source"],
  ];
  rows.push([
    "score",
    "F terrain fidelity",
    p.scores.F,
    "0-100",
    "DERIVED",
    "",
  ]);
  rows.push([
    "score",
    "U mission utility",
    p.scores.U,
    "0-100",
    "ASSUMED model",
    "",
  ]);
  rows.push([
    "score",
    "C evidence coverage",
    p.scores.C,
    "fraction",
    "DERIVED",
    "",
  ]);
  rows.push([
    "score",
    "P combined priority",
    p.scores.P,
    "0-100",
    "DERIVED",
    "",
  ]);
  for (const [k, cr] of Object.entries(p.scores.criteria))
    rows.push([
      "criterion",
      `${k} (${cr.name})`,
      cr.value,
      "0-1",
      cr.classification,
      cr.sources[0] ?? "",
    ]);
  for (const o of p.observations)
    rows.push([
      "observation",
      `${o.variable} ${o.name}`,
      o.value,
      o.unit,
      "MEASURED",
      o.source_url,
    ]);
  rows.push([
    "derived",
    "annual precipitation proxy",
    p.derived_climate.annual_precip_mm,
    "mm/year",
    "DERIVED",
    "",
  ]);
  rows.push([
    "derived",
    "seasonal monthly-mean temperature range",
    p.derived_climate.seasonal_temperature_range_c,
    "°C",
    "DERIVED",
    "",
  ]);
  if (p.terrain.metrics)
    for (const k of [
      "median_slope_deg",
      "p90_slope_deg",
      "relief_m",
      "detrended_rms_m",
    ] as const)
      rows.push([
        "terrain",
        k,
        p.terrain.metrics[k],
        k.endsWith("deg") ? "degrees" : "m",
        "DERIVED",
        p.terrain.sources[0] ?? "",
      ]);
  for (const comp of p.scores.fidelity_components)
    rows.push([
      "fidelity component",
      `${comp.feature} similarity`,
      comp.similarity,
      "0-1",
      "DERIVED",
      "",
    ]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

/** GeoJSON (WGS84 lon/lat) of the Earth candidate point and its 24 km SRTM lattice footprint. */
export function packetGeoJSON(p: Packet) {
  const { latitude: lat, longitude: lon } = p.candidate;
  const half = (p.terrain.footprint_m ?? 24000) / 2;
  const props = {
    id: p.candidate.id,
    name: p.candidate.name,
    status: p.candidate.status,
    mission_target: `${p.target.body} / ${p.target.name}`,
    F: p.scores.F,
    U: p.scores.U,
    C: p.scores.C,
    P: p.scores.P,
  };
  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        properties: { ...props, kind: "candidate" },
        geometry: { type: "Point" as const, coordinates: [lon, lat] },
      },
      {
        type: "Feature" as const,
        properties: {
          id: p.candidate.id,
          kind: "srtm-analysis-footprint",
          footprint_m: p.terrain.footprint_m,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates: [squareAround(lat, lon, half)],
        },
      },
    ],
  };
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
