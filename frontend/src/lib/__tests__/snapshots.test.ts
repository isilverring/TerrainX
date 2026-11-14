import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { realDataset } from "./fixtures";
import { defaultScenario } from "../counterfactual";
import { applyScenarios } from "../scoring";
import { readScienceRelease, releaseSchema } from "../release";
import {
  checkSnapshotRelease,
  makeSnapshot,
  snapshotLink,
  snapshotSchema,
} from "../snapshots";
import { buildPacket } from "../packet";
const manifest = releaseSchema.parse(
  JSON.parse(
    readFileSync(
      resolve(__dirname, "../../../public/data/release.json"),
      "utf8",
    ),
  ),
);
const data = { ...realDataset(), release: manifest };
const scenarios = {
  jezero: { ...defaultScenario("jezero"), alpha: 0.85 },
  "mare-crisium": defaultScenario("mare-crisium"),
};
afterEach(() => vi.unstubAllGlobals());
describe("immutable science and research replay", () => {
  it("round trips all model settings and the exact candidate/release", () => {
    const saved = makeSnapshot(
      data,
      scenarios,
      "jezero",
      data.candidates[0].id,
      "Sedimentary field question",
      [data.candidates[1].id],
    );
    const loaded = snapshotSchema.parse(JSON.parse(JSON.stringify(saved)));
    checkSnapshotRelease(loaded, data);
    expect(loaded.scenarios).toEqual(scenarios);
    expect(loaded.comparison_ids).toEqual([data.candidates[1].id]);
    const params = new URLSearchParams(snapshotLink(loaded).split("?")[1]);
    expect(params.get("science")).toBe(manifest.release_id);
    expect(params.get("datahash")).toBe(manifest.dataset_sha256);
    const replay = applyScenarios(data, loaded.scenarios),
      candidate = replay.candidates[0],
      packet = buildPacket(replay, candidate, "jezero");
    expect(packet.reproducibility.science_release).toBe(manifest.release_id);
    expect(packet.reproducibility.dataset_sha256).toBe(manifest.dataset_sha256);
    expect(packet.reproducibility.model.alpha).toBe(0.85);
  });
  it("refuses missing releases, mismatched hashes and unsupported model versions", () => {
    const saved = makeSnapshot(data, scenarios, "jezero", null, "Question");
    expect(() =>
      checkSnapshotRelease(saved, {
        ...data,
        release: { ...manifest, dataset_sha256: "0".repeat(64) },
      }),
    ).toThrow(/different immutable/);
    expect(() =>
      snapshotSchema.parse({
        ...saved,
        science: { ...saved.science, model_version: "future-unsupported" },
      }),
    ).toThrow();
    expect(() =>
      makeSnapshot(data, scenarios, "jezero", "nonexistent", "Question"),
    ).toThrow(/outside/);
  });
  it("validates the frozen dataset bytes before displaying results", async () => {
    const body = readFileSync(
      resolve(__dirname, "../../../public/data/dataset.json"),
    );
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(manifest)))
      .mockResolvedValueOnce(new Response(body));
    vi.stubGlobal("fetch", fetch);
    const loaded = await readScienceRelease(manifest.release_id);
    expect(loaded.candidates).toHaveLength(20);
    expect(fetch.mock.calls[1][0]).toBe(
      `/releases/${manifest.release_id}/dataset.json`,
    );
  });
  it("rejects changed bytes and never requests latest as a fallback", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(manifest)))
      .mockResolvedValueOnce(new Response("{}"));
    vi.stubGlobal("fetch", fetch);
    await expect(readScienceRelease(manifest.release_id)).rejects.toThrow(
      /checksum/,
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch
      .mockReset()
      .mockResolvedValue(new Response("missing", { status: 404 }));
    await expect(
      readScienceRelease("science-0000000000000000"),
    ).rejects.toThrow(/No newer data/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
