import { z } from "zod";
import { datasetSchema } from "./models";
import type { Dataset } from "./models";

const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const releaseSchema = z.object({
  schema_version: z.literal("1.0"),
  release_id: z.string().regex(/^science-[a-f0-9]{16}$/),
  model_version: z.literal("terrainx-model-v1"),
  dataset_sha256: digest,
  source_data_commit: z.string(),
  files: z.record(
    z.string(),
    z.object({ sha256: digest, bytes: z.number().int().positive() }),
  ),
});
export type ScienceRelease = z.infer<typeof releaseSchema>;
let active: ScienceRelease | undefined;
export const releaseFromHash = () => {
  const params = new URLSearchParams(window.location.hash.split("?")[1]);
  if (params.get("science")) return params.get("science")!;
  const code = params.get("share");
  if (
    code &&
    code.length <= 20000 &&
    window.location.hash.startsWith("#/field-study")
  )
    try {
      const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(
        new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))),
      );
      if (/^science-[a-f0-9]{16}$/.test(payload.r)) return payload.r;
    } catch {}
  return undefined;
};
export function scienceAssetUrl(filename: string) {
  if (!/^[a-z_]+\.(json|geojson)$/.test(filename))
    throw new Error("Invalid science filename");
  return active
    ? `/releases/${active.release_id}/${filename}`
    : `/data/${filename}`;
}
export function currentRelease() {
  return active;
}
export function activateRelease(release: ScienceRelease) {
  active = release;
}
export async function fetchScienceJson<T = unknown>(
  filename: string,
): Promise<T> {
  const release = active;
  const response = await fetch(scienceAssetUrl(filename));
  if (!response.ok) throw new Error(`Science asset ${filename} unavailable`);
  const body = await response.arrayBuffer(),
    record = release?.files[filename];
  if (
    release &&
    (!record ||
      record.bytes !== body.byteLength ||
      (await sha256(body)) !== record.sha256)
  )
    throw new Error(`Science asset ${filename} checksum failed`);
  return JSON.parse(new TextDecoder().decode(body)) as T;
}
export async function sha256(body: ArrayBuffer) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", body))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export async function readScienceRelease(id?: string): Promise<Dataset> {
  if (id && !/^science-[a-f0-9]{16}$/.test(id))
    throw new Error(
      "Invalid requested science release. No newer data were substituted.",
    );
  const manifestUrl = id
    ? `/releases/${id}/manifest.json`
    : "/data/release.json";
  const response = await fetch(manifestUrl, { cache: "no-cache" });
  if (!response.ok)
    throw new Error(
      `Requested science release unavailable (HTTP ${response.status}). No newer data were substituted.`,
    );
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new Error(
      "Requested science release unavailable. No newer data were substituted.",
    );
  }
  const manifest = releaseSchema.parse(raw);
  if (id && manifest.release_id !== id)
    throw new Error("Science release identity mismatch");
  const source = manifest.files["dataset.json"];
  if (!source || source.sha256 !== manifest.dataset_sha256)
    throw new Error("Dataset manifest mismatch");
  const dataResponse = await fetch(
    `/releases/${manifest.release_id}/dataset.json`,
  );
  if (!dataResponse.ok)
    throw new Error("Pinned scientific dataset unavailable");
  const body = await dataResponse.arrayBuffer();
  if (
    body.byteLength !== source.bytes ||
    (await sha256(body)) !== source.sha256
  )
    throw new Error(
      "Scientific dataset checksum failed. No results displayed.",
    );
  const data = datasetSchema.parse(JSON.parse(new TextDecoder().decode(body)));
  return { ...data, release: manifest };
}
