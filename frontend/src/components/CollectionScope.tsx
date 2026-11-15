import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { DataContext, useData } from "../lib/data";
import { applyScenarios, useModel } from "../lib/scoring";
import { useScienceFile } from "../lib/scienceFile";
import {
  expandedCollection,
  fieldSitesSchema,
  type Collection,
  PRIMARY_REFERENCE_PAGES,
} from "../lib/collections";
import { lunarPolarSchema } from "../lib/lunarPolar";
import { polarReference } from "../lib/polarReference";
import type { Dataset } from "../lib/models";
import { decodeShare } from "../lib/fieldStudy";

export default function CollectionScope({ children }: { children: ReactNode }) {
  const base = useData(),
    model = useModel(),
    location = useLocation(),
    [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const shareCode = params.get("share");
  const shared = useMemo(() => {
    if (location.pathname !== "/field-study" || !shareCode) return null;
    try {
      return decodeShare(shareCode);
    } catch {
      return null;
    }
  }, [location.pathname, shareCode]);
  const [retained, setRetained] = useState<Collection>(() =>
    params.get("cohort") === "expanded" ? "expanded" : "original",
  );
  const [retainedMission, setRetainedMission] = useState<
    "jezero" | "mare-crisium"
  >(() =>
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero",
  );
  const [retainedPolar, setRetainedPolar] = useState<string | null>(
    params.get("polar"),
  );
  const reference = shared
    ? (shared.p?.replace("lunar-polar:", "") ?? "none")
    : params.has("polar")
      ? params.get("polar")
      : retainedPolar;
  const polarId = reference && reference !== "none" ? reference : null;
  useLayoutEffect(() => {
    if (params.has("polar")) setRetainedPolar(params.get("polar"));
  }, [params]);
  const mission =
    shared?.m ??
    (params.get("mission") === "mare-crisium"
      ? "mare-crisium"
      : params.get("mission") === "jezero"
        ? "jezero"
        : retainedMission);
  useLayoutEffect(() => {
    if (params.has("mission")) setRetainedMission(mission);
  }, [mission, params]);
  const collection: Collection =
    shared?.o ??
    (polarId ||
    location.pathname === "/cells" ||
    location.pathname === "/research-lab"
      ? "expanded"
      : params.get("cohort") === "expanded"
        ? "expanded"
        : params.get("cohort") === "original"
          ? "original"
          : retained);
  useLayoutEffect(() => {
    if (!shared) return;
    // A full shared plan owns its context, including when copied without the
    // redundant URL fields. Canonicalize before links leave this workspace.
    const p = new URLSearchParams(window.location.hash.split("?")[1]);
    const desired = {
      cohort: shared.o ?? collection,
      mission: shared.m,
      polar: shared.p?.replace("lunar-polar:", "") ?? "none",
    };
    let changed = false;
    for (const [key, value] of Object.entries(desired))
      if (p.get(key) !== value) {
        p.set(key, value);
        changed = true;
      }
    if (shared.e && p.get("protocol") !== "source") {
      p.set("protocol", "source");
      changed = true;
    }
    if (!shared.e && p.has("protocol")) {
      p.delete("protocol");
      changed = true;
    }
    if (changed) setParams(p, { replace: true });
  }, [shared, collection, setParams]);
  useLayoutEffect(() => {
    if (params.has("cohort"))
      setRetained(
        params.get("cohort") === "expanded" ? "expanded" : "original",
      );
  }, [params]);
  const { value, error } = useScienceFile(
    "field_candidates.json",
    fieldSitesSchema,
    "Expanded search is absent from this historical release. No newer observations were substituted.",
    collection === "expanded",
  );
  const polar = useScienceFile(
    "lunar_polar.json",
    lunarPolarSchema,
    "Polar reference absent from this pinned release.",
    !!polarId,
  );
  const built = useMemo(() => {
    let data: Dataset = {
      ...(collection === "expanded" && value
        ? expandedCollection(base, value.candidates)
        : base),
      collection,
      active_mission: mission,
    };
    try {
      if (polarId && mission !== "mare-crisium")
        throw Error(
          "A lunar polar reference cannot be paired with the Mars mission. Leave the polar reference or open its lunar dossier; no planetary target was substituted.",
        );
      if (polarId && PRIMARY_REFERENCE_PAGES.has(location.pathname))
        throw Error(
          "This workspace uses fixed primary planetary references. Leave the polar reference explicitly, or continue it through Discovery, DNA, Passport, Research or Field study. No primary-target data were substituted.",
        );
      if (polarId && polar.value)
        data = polarReference(data, polar.value, polarId);
      return { data: applyScenarios(data, model.scenarios), error: "" };
    } catch (e) {
      return { data, error: String(e) };
    }
  }, [
    base,
    value,
    collection,
    mission,
    model.scenarios,
    polarId,
    polar.value,
    location.pathname,
  ]);
  const data = built.data;
  // Route links may omit cohort; keep it explicitly in the URL before rendering
  // a dossier, so browser refresh, copied addresses and navigation agree.
  const show = !["/", "/demo", "/guide"].includes(location.pathname);
  return (
    <DataContext.Provider value={data}>
      <div className="collection-shell">
        {show && (
          <section
            className="collection-banner"
            aria-label="Scientific collection"
          >
            <label>
              Study collection{" "}
              <select
                aria-label="Study collection"
                disabled={!!polarId || !!shared}
                value={collection}
                onChange={(e) => {
                  const next = e.target.value as Collection;
                  if (next === "original" && location.pathname === "/cells") {
                    setRetained(next);
                    navigate(
                      `/explorer?mission=${mission}&cohort=original&science=${base.release?.release_id}`,
                    );
                    return;
                  }
                  setRetained(next);
                  const p = new URLSearchParams(params);
                  p.set("cohort", next);
                  setParams(p);
                }}
              >
                <option value="original">
                  Original study · 16 candidates + 4 benchmarks
                </option>
                <option value="expanded">
                  Expanded search · 130 cells + 4 benchmarks
                </option>
              </select>
            </label>
            <span>
              {collection === "original"
                ? "Frozen baseline shortlist. Expanded cells remain a separate study."
                : "All screened-cell profiles; regional geology and coarse terrain remain preliminary."}
            </span>
            {polarId && (
              <span>
                Polar reference:{" "}
                {polar.value?.sites.find((s) => s.id === polarId)?.feature ??
                  polarId}{" "}
                · U unassessed{" "}
                <button
                  className="link-button"
                  disabled={!!shared}
                  title={
                    shared
                      ? "Start a separate plan before leaving the pinned reference"
                      : undefined
                  }
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    p.set("polar", "none");
                    setRetainedPolar(null);
                    setParams(p);
                  }}
                >
                  Leave polar reference
                </button>
              </span>
            )}
            {shared && (
              <span>
                Shared-plan context is pinned.{" "}
                <button
                  className="link-button"
                  onClick={() => {
                    const p = new URLSearchParams(params);
                    p.delete("share");
                    p.delete("protocol");
                    setParams(p);
                  }}
                >
                  Start a separate plan
                </button>
              </span>
            )}
          </section>
        )}
        {(error && collection === "expanded") ||
        built.error ||
        polar.error ||
        (collection === "expanded" && !value) ||
        (polarId && !polar.value) ? (
          <main className="document-page">
            <h1>
              {error || built.error || polar.error
                ? "Requested collection/reference unavailable"
                : "Validating scientific observations…"}
            </h1>
            <p role="alert">{error || built.error || polar.error}</p>
            {polarId && (
              <button
                className="button outline"
                onClick={() => {
                  const p = new URLSearchParams(params);
                  p.set("polar", "none");
                  setRetainedPolar(null);
                  setParams(p);
                }}
              >
                Use this workspace's primary references
              </button>
            )}
          </main>
        ) : (
          children
        )}
      </div>
    </DataContext.Provider>
  );
}
