/** Loads the real released dataset for tests (never synthetic NASA values). */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { datasetSchema } from "../models";
import type { Dataset } from "../models";
export function realDataset(): Dataset {
  const raw = JSON.parse(
    readFileSync(
      resolve(__dirname, "../../../public/data/dataset.json"),
      "utf-8",
    ),
  );
  return datasetSchema.parse(raw);
}
