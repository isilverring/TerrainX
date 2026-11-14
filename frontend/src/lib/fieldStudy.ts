/**
 * Field Study Builder — geometry, terrain sampling, protocol and export helpers.
 *
 * Geometry mirrors science/ingestion/srtm.py exactly: the cached SRTM sample grid is
 * equirectangular around the candidate centre with step_lat = spacing / R and
 * step_lon = step_lat / cos(lat0), R = 6 371 000 m, rows south→north, columns west→east.
 * Station elevations are bilinear interpolations between those real samples; they are
 * a regional trend (4 km node spacing), never a route survey or hazard assessment.
 */
import { z } from "zod";
import type { Candidate, FieldExperiment, Mission } from "./models";
import { snapshotSchema, type ResearchSnapshot } from "./snapshots";

export const EARTH_RADIUS_M = 6_371_000;
const RAD = Math.PI / 180;

export type LatLon = { lat: number; lon: number };
export type TerrainGrid = {
  center: LatLon;
  spacingM: number;
  size: number;
  /** rows south→north, columns west→east (as cached). */
  z: (number | null)[][];
};

export function terrainGrid(c: Candidate): TerrainGrid | null {
  const t = c.terrain,
    z = t.elevations_m;
  if (
    t.status !== "available" ||
    !z ||
    z.length < 2 ||
    z.some((row) => row.length !== z.length) ||
    !t.sample_spacing_m ||
    t.sample_spacing_m <= 0 ||
    !z.flat().some((v) => v !== null && Number.isFinite(v))
  )
    return null;
  return {
    center: { lat: c.latitude, lon: c.longitude },
    spacingM: t.sample_spacing_m,
    size: z.length,
    z,
  };
}

/** Half-width of the sampled footprint in metres (node centre to edge node). */
export const halfExtent = (g: TerrainGrid) => ((g.size - 1) / 2) * g.spacingM;

/** Local east/north metres → lat/lon using the same steps as the SRTM sampler. */
export function toLatLon(g: TerrainGrid, x: number, y: number): LatLon {
  const dLat = y / EARTH_RADIUS_M / RAD;
  const dLon =
    dLat === 0 && x === 0
      ? 0
      : x / EARTH_RADIUS_M / RAD / Math.cos(g.center.lat * RAD);
  return { lat: g.center.lat + dLat, lon: g.center.lon + dLon };
}
export function toLocal(g: TerrainGrid, p: LatLon) {
  return {
    x:
      (p.lon - g.center.lon) *
      RAD *
      EARTH_RADIUS_M *
      Math.cos(g.center.lat * RAD),
    y: (p.lat - g.center.lat) * RAD * EARTH_RADIUS_M,
  };
}
export function insideFootprint(g: TerrainGrid, x: number, y: number) {
  const h = halfExtent(g) + 1; // 1 m tolerance for 1e-7° coordinate rounding
  return Math.abs(x) <= h && Math.abs(y) <= h;
}

/** Bilinear interpolation between the real cached samples; null outside or near gaps. */
export function elevationAt(
  g: TerrainGrid,
  x: number,
  y: number,
): number | null {
  if (!insideFootprint(g, x, y)) return null;
  const h = halfExtent(g);
  x = Math.max(-h, Math.min(h, x));
  y = Math.max(-h, Math.min(h, y));
  const fc = (x + h) / g.spacingM,
    fr = (y + h) / g.spacingM,
    c0 = Math.min(Math.floor(fc), g.size - 2),
    r0 = Math.min(Math.floor(fr), g.size - 2),
    tx = fc - c0,
    ty = fr - r0;
  const z00 = g.z[r0][c0],
    z01 = g.z[r0][c0 + 1],
    z10 = g.z[r0 + 1][c0],
    z11 = g.z[r0 + 1][c0 + 1];
  if (z00 == null || z01 == null || z10 == null || z11 == null) return null;
  return (
    z00 * (1 - tx) * (1 - ty) +
    z01 * tx * (1 - ty) +
    z10 * (1 - tx) * ty +
    z11 * tx * ty
  );
}

/** Great-circle distance on the same 6 371 km sphere used by discovery separation. */
export function haversineM(a: LatLon, b: LatLon) {
  const p = a.lat * RAD,
    q = b.lat * RAD,
    dl = (b.lon - a.lon) * RAD,
    h =
      Math.sin((q - p) / 2) ** 2 +
      Math.cos(p) * Math.cos(q) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}
/** Initial great-circle bearing, degrees clockwise from true north. */
export function bearingDeg(a: LatLon, b: LatLon) {
  const p = a.lat * RAD,
    q = b.lat * RAD,
    dl = (b.lon - a.lon) * RAD;
  const y = Math.sin(dl) * Math.cos(q),
    x = Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(dl);
  return (((Math.atan2(y, x) / RAD) % 360) + 360) % 360;
}
export function compass(deg: number) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
}

export const STATION_KINDS = {
  observation: { label: "Observation", glyph: "◉", tint: "#3ec9b0" },
  sample: { label: "Sample", glyph: "▲", tint: "#ff8a65" },
  transect: { label: "Transect point", glyph: "◆", tint: "#f2c14e" },
  imaging: { label: "Imaging / photogrammetry", glyph: "▣", tint: "#7fb2ff" },
  instrument: { label: "Instrument / rover test", glyph: "✦", tint: "#c39bff" },
} as const;
export type StationKind = keyof typeof STATION_KINDS;

export const stationSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  kind: z.enum(["observation", "sample", "transect", "imaging", "instrument"]),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  purpose: z.string().max(400),
});
export type Station = z.infer<typeof stationSchema>;

export const PERMIT_QUESTIONS = [
  "Who owns or manages the land, and is written access permission required?",
  "Is a sampling, research or collection permit required, and from which authority?",
  "Are samples allowed to leave the site or the country (export / transfer rules)?",
  "Is the area protected (heritage, conservation, military, mining concession)?",
  "Do local communities or custodians need to be consulted before the visit?",
  "Which local guide, partner institution or geological survey contact can advise?",
  "What are the heat, water, communications and medical-evacuation constraints?",
] as const;

export const SAMPLE_FIELDS = [
  "Sample ID (printed label + field book)",
  "GNSS position with stated horizontal error",
  "Date, time (UTC) and collector",
  "Photographs: context, close-up with scale bar and north arrow",
  "Lithology, grain size, colour, structures (field description)",
  "Orientation / bedding attitude where measurable",
  "Container, mass or volume and preservation method",
  "Chain-of-custody signature at each hand-over",
] as const;

const KIND_EQUIPMENT: Record<StationKind, string[]> = {
  observation: ["Hand lens, grain-size card and field notebook"],
  sample: [
    "Sample bags/jars, labels, permanent markers, sterile tools where relevant",
  ],
  transect: ["Measuring tape or laser rangefinder, compass-clinometer"],
  imaging: ["Calibrated camera with scale bar; drone only where permitted"],
  instrument: ["Instrument power/data logs and a test-condition checklist"],
};
const BASE_EQUIPMENT = [
  "Printed permit/consent documents and emergency contacts",
  "Water, sun protection and first-aid kit appropriate to the climate",
];

export const fieldStudySchema = z
  .object({
    field_study_version: z.literal("1.0"),
    id: z.string().min(1).max(60),
    title: z.string().min(1).max(120),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    snapshot: snapshotSchema,
    candidate_id: z.string(),
    mission: z.enum(["jezero", "mare-crisium"]),
    target_reference: z.string().optional(),
    mission_role: z.string().optional(),
    hypothesis: z.string().max(1200),
    objective: z.string().max(400),
    stations: z.array(stationSchema).max(24),
    measurements: z
      .array(z.object({ text: z.string().max(300), done: z.boolean() }))
      .max(30),
    equipment: z
      .array(z.object({ text: z.string().max(300), done: z.boolean() }))
      .max(40),
    success_indicators: z.string().max(1200),
    permits: z
      .array(
        z.object({
          question: z.string().max(300),
          answer: z.string().max(600),
        }),
      )
      .max(20),
    local_notes: z.string().max(4000),
  })
  .superRefine((study, ctx) => {
    if (
      study.candidate_id !== study.snapshot.candidate_id ||
      study.mission !== study.snapshot.mission
    )
      ctx.addIssue({
        code: "custom",
        message: "Study identity disagrees with its saved snapshot",
      });
    if (new Set(study.stations.map((s) => s.id)).size !== study.stations.length)
      ctx.addIssue({
        code: "custom",
        message: "Station identifiers must be unique",
      });
  });
export type FieldStudy = z.infer<typeof fieldStudySchema>;

export function equipmentFor(
  exp: FieldExperiment,
  stations: Pick<Station, "kind">[],
) {
  const kinds = [...new Set(stations.map((s) => s.kind))];
  return [
    ...new Set([
      ...exp.equipment,
      ...kinds.flatMap((k) => KIND_EQUIPMENT[k]),
      ...BASE_EQUIPMENT,
    ]),
  ];
}

export function newFieldStudy(
  snapshot: ResearchSnapshot,
  candidate: Candidate,
  mission: Mission,
  title: string,
): FieldStudy {
  const exp = candidate.assessments[mission].experiment,
    now = new Date().toISOString();
  return fieldStudySchema.parse({
    field_study_version: "1.0",
    id: `fs-${Date.now().toString(36)}`,
    title,
    created_at: now,
    updated_at: now,
    snapshot,
    candidate_id: candidate.id,
    mission,
    target_reference: snapshot.target_reference,
    mission_role: snapshot.target_reference ? "Legacy lunar model slot only; target_reference is the physical reference. Utility is unassessed." : "Mission preset and planetary reference",
    hypothesis: exp.hypothesis,
    objective: exp.objective,
    stations: [],
    measurements: exp.measurements.map((text) => ({ text, done: false })),
    equipment: equipmentFor(exp, []).map((text) => ({ text, done: false })),
    success_indicators: exp.success_indicator,
    permits: PERMIT_QUESTIONS.map((question) => ({ question, answer: "" })),
    local_notes: "",
  });
}

export type Leg = {
  from: Station;
  to: Station;
  distanceM: number;
  bearing: number;
  dz: number | null;
};
export function legs(g: TerrainGrid, stations: Station[]): Leg[] {
  return stations.slice(1).map((to, i) => {
    const from = stations[i],
      a = toLocal(g, from),
      b = toLocal(g, to),
      za = elevationAt(g, a.x, a.y),
      zb = elevationAt(g, b.x, b.y);
    return {
      from,
      to,
      distanceM: haversineM(from, to),
      bearing: bearingDeg(from, to),
      dz: za != null && zb != null ? zb - za : null,
    };
  });
}

/** Elevation trend along straight legs, sampled every stepM on the interpolated grid. */
export function traverseProfile(
  g: TerrainGrid,
  stations: Station[],
  stepM = 250,
) {
  const out: { d: number; z: number | null; station?: string }[] = [];
  let run = 0;
  stations.forEach((s, i) => {
    const a = toLocal(g, s);
    if (i === 0)
      out.push({ d: 0, z: elevationAt(g, a.x, a.y), station: s.name });
    const next = stations[i + 1];
    if (!next) return;
    const b = toLocal(g, next),
      len = haversineM(s, next),
      n = Math.max(1, Math.ceil(len / stepM));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push({
        d: run + len * t,
        z: elevationAt(g, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t),
        station: k === n ? next.name : undefined,
      });
    }
    run += len;
  });
  return out;
}

export function traverseTotals(profile: { d: number; z: number | null }[]) {
  let ascent = 0,
    descent = 0;
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1].z,
      b = profile[i].z;
    if (a == null || b == null) continue;
    if (b > a) ascent += b - a;
    else descent += a - b;
  }
  const zs = profile.map((p) => p.z).filter((z): z is number => z != null);
  return {
    distanceM: profile.at(-1)?.d ?? 0,
    ascentM: ascent,
    descentM: descent,
    minZ: zs.length ? Math.min(...zs) : null,
    maxZ: zs.length ? Math.max(...zs) : null,
  };
}

/** Naismith's rule: 5 km/h on the flat plus 1 h per 600 m of ascent (planning heuristic). */
export const naismithHours = (distanceM: number, ascentM: number) =>
  distanceM / 5000 + ascentM / 600;

/**
 * Deterministic starter transect: lowest valid sample node → highest valid sample node,
 * 5 evenly spaced stations. Purely a relief-crossing suggestion from coarse samples.
 */
export function reliefTransect(g: TerrainGrid): Station[] {
  let lo: [number, number, number] | null = null,
    hi: [number, number, number] | null = null;
  g.z.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v == null) return;
      if (!lo || v < lo[0]) lo = [v, r, c];
      if (!hi || v > hi[0]) hi = [v, r, c];
    }),
  );
  if (!lo || !hi) return [];
  const h = halfExtent(g),
    [, r0, c0] = lo as [number, number, number],
    [, r1, c1] = hi as [number, number, number];
  const a = { x: c0 * g.spacingM - h, y: r0 * g.spacingM - h },
    b = { x: c1 * g.spacingM - h, y: r1 * g.spacingM - h };
  const kinds: StationKind[] = [
    "transect",
    "observation",
    "sample",
    "observation",
    "transect",
  ];
  return kinds.map((kind, i) => {
    const t = i / (kinds.length - 1),
      p = toLatLon(g, a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    return {
      id: `S${String(i + 1).padStart(2, "0")}`,
      name:
        i === 0
          ? "Low node"
          : i === kinds.length - 1
            ? "High node"
            : `Station ${i + 1}`,
      kind,
      lat: round7(p.lat),
      lon: round7(p.lon),
      purpose:
        i === 0 || i === kinds.length - 1
          ? "Transect end at a real SRTM sample node (coarse 4 km grid)."
          : "Suggested mid-transect stop; confirm exposure and access locally.",
    };
  });
}
export const round7 = (v: number) => Math.round(v * 1e7) / 1e7;

export function sampleId(candidate: Candidate, station: Station, n = 1) {
  const region =
    candidate.region_id
      .replace(/[^a-z]/gi, "")
      .slice(0, 3)
      .toUpperCase() || "TX";
  return `TX-${region}-${station.id}-${String(n).padStart(2, "0")}`;
}

const xml = (s: string) =>
  s.replace(
    /[<>&'"]/g,
    (ch) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[ch]!,
  );

/** GPX 1.1 with stations as waypoints and the proposed traverse as a route. */
export function toGpx(
  study: FieldStudy,
  candidate: Candidate,
  g: TerrainGrid | null,
) {
  const ele = (s: Station) => {
    if (!g) return "";
    const p = toLocal(g, s),
      z = elevationAt(g, p.x, p.y);
    return z == null ? "" : `<ele>${z.toFixed(1)}</ele>`;
  };
  const desc = (s: Station) =>
    xml(
      `${STATION_KINDS[s.kind].label}. ${s.purpose} Proposed station, not a verified access point.`,
    );
  const wpts = study.stations
    .map(
      (s) =>
        `  <wpt lat="${s.lat.toFixed(7)}" lon="${s.lon.toFixed(7)}">${ele(s)}<name>${xml(`${s.id} ${s.name}`)}</name><desc>${desc(s)}</desc><type>${s.kind}</type></wpt>`,
    )
    .join("\n");
  const rtepts = study.stations
    .map(
      (s) =>
        `    <rtept lat="${s.lat.toFixed(7)}" lon="${s.lon.toFixed(7)}"><name>${xml(s.id)}</name></rtept>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TerrainX Field Study Builder" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${xml(study.title)}</name><desc>${xml(`${candidate.name} · ${study.mission} · science ${study.snapshot.science.release_id}. Elevations are bilinear interpolations of cached SRTM samples (4 km spacing); proposal only, no field verification.`)}</desc><time>${study.updated_at}</time></metadata>
${wpts}
  <rte><name>${xml(`${study.title} — proposed traverse`)}</name>
${rtepts}
  </rte>
</gpx>
`;
}

const KEY = "terrainx-field-studies-v1";
export function savedFieldStudies(): FieldStudy[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw)
      ? raw
          .map((x) => fieldStudySchema.safeParse(x))
          .filter((x) => x.success)
          .map((x) => x.data!)
          .slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export function persistFieldStudies(studies: FieldStudy[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(studies.slice(0, 20)));
    return true;
  } catch {
    return false;
  }
}

/* ---------- Share links: stations + intent in the URL, pinned to the release ---------- */
const shareSchema = z.object({
  v: z.literal(1),
  r: z.string().regex(/^science-[a-f0-9]{16}$/),
  d: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  mv: z.literal("terrainx-model-v1").optional(),
  q: snapshotSchema.shape.scenarios.optional(),
  o: z.enum(["original", "expanded"]).optional(),
  p: z.string().regex(/^lunar-polar:[a-z0-9-]+$/).optional(),
  c: z.string().min(1).max(80),
  m: z.enum(["jezero", "mare-crisium"]),
  t: z.string().min(1).max(120),
  h: z.string().max(1200),
  s: z
    .array(
      z.tuple([
        z.string().min(1).max(40),
        z.string().min(1).max(80),
        z.enum(["observation", "sample", "transect", "imaging", "instrument"]),
        z.number().min(-90).max(90),
        z.number().min(-180).max(180),
        z.string().max(400),
      ]),
    )
    .max(24),
});
export type SharedStudy = z.infer<typeof shareSchema>;

const toBase64Url = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromBase64Url = (code: string) => {
  const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(
    Uint8Array.from(bin, (ch) => ch.charCodeAt(0)),
  );
};

/**
 * `compact` drops free text (hypothesis, purposes) and rounds coordinates to 1e-5° (~1 m)
 * so a printed QR code stays scannable; the printed field book carries the full text.
 */
export function encodeShare(study: FieldStudy, compact = false) {
  const r5 = (v: number) => Math.round(v * 1e5) / 1e5;
  const payload: SharedStudy = {
    v: 1,
    r: study.snapshot.science.release_id,
    d: study.snapshot.science.dataset_sha256,
    mv: study.snapshot.science.model_version,
    o: study.snapshot.collection ?? "original",
    p: study.snapshot.target_reference,
    ...(compact ? {} : { q: study.snapshot.scenarios }),
    c: study.candidate_id,
    m: study.mission,
    t: study.title,
    h: compact ? "" : study.hypothesis,
    s: study.stations.map((s) => [
      s.id,
      s.name,
      s.kind,
      compact ? r5(s.lat) : s.lat,
      compact ? r5(s.lon) : s.lon,
      compact ? "" : s.purpose,
    ]),
  };
  return toBase64Url(JSON.stringify(payload));
}
export function decodeShare(code: string): SharedStudy {
  if (code.length > 20000) throw new Error("Share link is too long");
  return shareSchema.parse(JSON.parse(fromBase64Url(code)));
}
export function stationsFromShare(shared: SharedStudy): Station[] {
  return shared.s.map(([id, name, kind, lat, lon, purpose]) =>
    stationSchema.parse({ id, name, kind, lat, lon, purpose }),
  );
}
