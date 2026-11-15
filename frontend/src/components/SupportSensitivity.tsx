import { Link } from "react-router-dom";
import { useData, number } from "../lib/data";
import { useScienceFile } from "../lib/scienceFile";
import { pilotSchema, pilotRange } from "../lib/pilot";
import type { Mission } from "../lib/models";
export default function SupportSensitivity({
  id,
  mission,
}: {
  id: string;
  mission: Mission;
}) {
  const data = useData(),
    expanded = !!data.release?.files["terrain_support.json"];
  const { value, error } = useScienceFile(
    expanded ? "terrain_support.json" : "terrain_pilot.json",
    pilotSchema,
    "No source-support experiment exists in this pinned release.",
  );
  if (data.target_reference)
    return (
      <p className="scientific-caveat">
        Matched-support analysis for this polar reference is unassessed. The
        primary-target terrain experiment cannot be substituted.
      </p>
    );
  const result = value?.results.find(
      (r) => r.candidate_id === id && r.mission === mission,
    ),
    range = result ? pilotRange(result.scenarios) : null;
  return (
    <section className="science-section support-sensitivity">
      <h2>How spatial support changes terrain fidelity</h2>
      {range && result ? (
        <>
          <p>
            Default-model F spans{" "}
            <strong>
              {number(range.min, 1)}–{number(range.max, 1)}
            </strong>{" "}
            across{" "}
            {result.scenarios.filter((s) => s.fidelity.value !== null).length}{" "}
            valid support/offset choices. Actual Copernicus DSM and PDS
            elevations use 8/12 km box support, 4 km spacing and the same 24 km
            centre window.
          </p>
          <p className="caption">
            Separate default-tolerance processing sensitivity, not statistical
            confidence or the active custom-model score. Original SRTM F/U/C/P
            remain unchanged. No geology or safety conclusion follows.
          </p>
          <Link
            to={`/terrain-pilot?study=${expanded ? "expanded" : "original"}&id=${id}&mission=${mission}&cohort=${data.collection ?? "original"}`}
          >
            Inspect grids and F-only order sensitivity
          </Link>
        </>
      ) : (
        <p>
          {error ??
            (value
              ? "This site has not been processed in the source-support study. No range was inferred."
              : "Validating source-support experiment…")}
        </p>
      )}
    </section>
  );
}
