import { useEffect, useState } from "react";
import type { z } from "zod";
import { currentRelease, fetchScienceJson } from "./release";
import { useData } from "./data";

/**
 * Loads an optional science file from the pinned release, verifying its SHA-256 against
 * the release manifest (via fetchScienceJson) and its shape with Zod. A historical
 * release without the file reports that plainly instead of substituting newer data.
 */
export function useScienceFile<T extends z.ZodTypeAny>(filename: string, schema: T, missing: string, enabled = true) {
  const data = useData(),
    [value, setValue] = useState<z.infer<T> | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setValue(null);
    setError("");
    if (!enabled) return;
    if (!currentRelease()?.files[filename]) {
      setError(missing);
      return;
    }
    fetchScienceJson(filename)
      .then((x) => live && setValue(schema.parse(x)))
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [data.release?.release_id, filename, schema, missing, enabled]);
  return { value, error };
}
