import { Link, useLocation } from "react-router-dom";
import { useScienceFile } from "../lib/scienceFile";
import {
  siteEvidenceSchema,
  type SiteEvidence as Case,
} from "../lib/siteEvidence";
import { number } from "../lib/data";
import { studyPath } from "../lib/collections";
import { EvidenceTag, SourceLink } from "./ui";
function EvidenceCase({ item }: { item: Case }) {
  const location = useLocation();
  return (
    <article
      className="science-section site-evidence"
      id={`evidence-${item.candidate_id}`}
    >
      <p className="document-label">
        Independent literature · geographic scope checked
      </p>
      <h2>{item.title}</h2>
      <p>{item.classification}</p>
      <EvidenceTag kind="LITERATURE-SUPPORTED" />
      {item.subsite && <h3>{item.subsite}</h3>}
      <p>{item.supported}</p>
      <p>
        <strong>Contradictions and limits.</strong> {item.contradiction}
      </p>
      <p className="scientific-caveat">{item.scope}</p>
      <div className="evidence-geography">
        <h3>Published positions, separate from the screening centre</h3>
        <p className="mono">
          Cell centre {item.candidate_center.latitude.toFixed(3)}°,{" "}
          {item.candidate_center.longitude.toFixed(3)}° · approximate 24 km
          terrain window
        </p>
        {item.reported_points.map((p) => (
          <section key={p.id}>
            <h4>{p.id}</h4>
            <p>
              {p.material} · reported position {p.latitude.toFixed(4)}°,{" "}
              {p.longitude.toFixed(4)}°
            </p>
            <p>
              <strong>
                {number(p.derived_scope.distance_from_center_km, 1)} km
              </strong>{" "}
              from centre ·{" "}
              {p.derived_scope.within_approximate_analysis_window
                ? "inside the approximate analysis window; exposure/access unverified"
                : "outside the analysis window; measurements not transferred"}
            </p>
            <p className="caption">
              Distance/window classification is derived, not a new field
              measurement. {p.coordinate_datum}.{" "}
              <SourceLink url={p.source_url}>Primary source</SourceLink>
            </p>
          </section>
        ))}
      </div>
      <h3>Proposed experiment — no outcomes observed</h3>
      <p>{item.experiment.hypothesis}</p>
      <p>
        <strong>Objective.</strong> {item.experiment.objective}
      </p>
      <p>
        <strong>Equipment.</strong> {item.experiment.equipment.join("; ")}
      </p>
      <ol>
        {item.experiment.procedure.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <p>{item.experiment.success_indicator}</p>
      <p>
        <strong>Next measurement.</strong> {item.next_measurement}
      </p>
      <p>
        <strong>Unvalidated.</strong> {item.experiment.unvalidated}
      </p>
      <p>
        <strong>Cannot reproduce.</strong> {item.experiment.cannot_reproduce}
      </p>
      <div className="reference-list">
        {item.sources.map((s) => (
          <div key={s.id}>
            <SourceLink url={s.url}>{s.title}</SourceLink>
            <p className="caption">
              {s.geographic_scope} · reviewed {s.accessed_at}
            </p>
          </div>
        ))}
      </div>
      <Link
        className="button outline"
        to={studyPath(
          `/site/${item.candidate_id}?mission=${item.mission}&cohort=expanded&polar=none`,
          location.search,
        )}
      >
        Inspect this research candidate
      </Link>{" "}
      <Link
        className="button primary"
        to={studyPath(
          `/field-study?id=${item.candidate_id}&mission=${item.mission}&cohort=expanded&polar=none&protocol=source`,
          location.search,
        )}
      >
        Use literature-informed field proposal
      </Link>
    </article>
  );
}
export default function SiteEvidence({ id }: { id?: string }) {
  const { value, error } = useScienceFile(
    "site_evidence.json",
    siteEvidenceSchema,
    "Scoped candidate literature was not part of this historical release. No newer evidence substituted.",
  );
  if (!value)
    return id ? null : (
      <p className="caption">{error ?? "Validating independent literature cases…"}</p>
    );
  return (
    <>
      {value.cases
        .filter((c) => !id || c.candidate_id === id)
        .map((item) => (
          <EvidenceCase key={item.candidate_id} item={item} />
        ))}
    </>
  );
}
