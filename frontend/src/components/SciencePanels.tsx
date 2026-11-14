import { lazy, Suspense } from "react";
import { EvidenceTag, SourceLink } from "./ui";
import { coordinates, labels, number, unitSuffix } from "../lib/data";
import type { Assessment, Candidate, Target } from "../lib/models";
import { EvidenceButton } from "./EvidenceInspector";
import { observationFact, periodText } from "../lib/evidence";
const ClimateChart = lazy(() => import("./ClimateChart"));
export function ObservationPanel({
  candidate,
  chart = true,
}: {
  candidate: Candidate;
  chart?: boolean;
}) {
  const c = candidate.climate;
  return (
    <section className="science-section">
      <div className="section-heading">
        <h2>NASA Earth observations</h2>
        <EvidenceTag kind="MEASURED" />
      </div>
      <p className="section-intro">
        Gridded reanalysis and satellite-derived climatology. These values
        represent a coarse cell near {coordinates(candidate)}, not a particular
        rock outcrop.
      </p>
      <div className="observation-grid">
        {(
          [
            ["Air temperature", c.T2M],
            ["Daily precipitation", c.PRECTOTCORR],
            ["Wind at 10m", c.WS10M],
            ["Solar irradiance", c.ALLSKY_SFC_SW_DWN],
            ["Surface pressure", c.PS],
            ["Relative humidity", c.RH2M],
          ] as const
        ).map(([label, o]) => (
          <div className="observation" key={label}>
            <span>{label}</span>
            {o ? (
              <EvidenceButton fact={observationFact(candidate, label, o)}>
                <strong>
                  {number(o?.value, 2)}
                  <small>{o?.unit ?? "unavailable"}</small>
                </strong>
              </EvidenceButton>
            ) : (
              <strong>
                — <small>unavailable</small>
              </strong>
            )}
            {o ? (
              <SourceLink url={o.provenance.source_url}>
                NASA POWER · {periodText(o.provenance.period)}
              </SourceLink>
            ) : (
              <EvidenceTag kind="UNAVAILABLE" />
            )}
          </div>
        ))}
      </div>
      <div className="derived-observations">
        <span>
          Annual precipitation proxy{" "}
          <strong>{number(c.annual_precip_mm, 1)}mm/year</strong>
        </span>
        <span>
          Seasonal monthly-mean air-temperature range{" "}
          <strong>{number(c.seasonal_temperature_range_c, 1)}°C</strong>
        </span>
        <EvidenceTag kind="DERIVED" />
      </div>
      <p className="caption">
        Annual precipitation = mean daily rate ×365.25. Seasonal range =
        max(monthly mean) − min(monthly mean); it is not a daily temperature
        swing. Meteorology 0.5°×0.625°; solar 1°×1°. Original solar units remain
        MJ/m²/day where returned.
      </p>
      <p className="caption">
        Point profile retrieved{" "}
        {c.T2M?.provenance.retrieved_at ?? "unavailable"}. Original source
        coordinates: {candidate.latitude}, {candidate.longitude}. Derived
        annual/seasonal values inherit this observation provenance.
      </p>
      {chart && c.T2M ? (
        <Suspense fallback={<p>Loading monthly climate profile…</p>}>
          <ClimateChart observation={c.T2M} />
        </Suspense>
      ) : null}
    </section>
  );
}
export function TerrainPanel({
  candidate,
  target,
  assessment,
}: {
  candidate: Candidate;
  target: Target;
  assessment: Assessment;
}) {
  const earth = candidate.terrain.metrics,
    planet = target.terrain.metrics;
  return (
    <section className="science-section">
      <div className="section-heading">
        <h2>Broad-scale terrain DNA</h2>
        <EvidenceTag kind="DERIVED" />
      </div>
      <p className="section-intro">
        A common 4 km lattice across 24×24 km; central slopes use an 8 km
        baseline. Native support differs: SRTM ≈ 90 m; {target.body} ≈{" "}
        {number(target.terrain.native_resolution_m?.y, 0)}m north–south.
      </p>
      <div className="table-scroll">
        <table>
          <caption>
            Cross-body metrics exclude absolute elevation, whose reference
            surfaces differ.
          </caption>
          <thead>
            <tr>
              <th>Terrain feature</th>
              <th>Earth</th>
              <th>{target.name}</th>
              <th>Model tolerance</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(labels).map(([key, label]) => {
              const k = key as keyof typeof labels;
              const component = assessment.fidelity.components.find(
                (c) => c.feature === key,
              );
              return (
                <tr key={key}>
                  <th>{label}</th>
                  <td>
                    {number(earth?.[k], 2)}
                    {unitSuffix(k)}
                  </td>
                  <td>
                    {number(planet?.[k], 2)}
                    {unitSuffix(k)}
                  </td>
                  <td>
                    {component
                      ? `${number(component.tolerance, 0)}${unitSuffix(k)}`
                      : "Not assessed"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="caption">
        Earth valid samples: {earth?.valid_samples ?? "unavailable"}/49 ·
        Planet: {planet?.valid_samples ?? "unavailable"}/49. Detrended RMS is
        regional variation from a fitted plane, not regolith roughness.
      </p>
      <div className="scientific-warning">
        {assessment.fidelity.warning ?? assessment.fidelity.reason}
      </div>
      <div className="source-row">
        {candidate.terrain.provenance?.slice(0, 1).map((p) => (
          <SourceLink key={p.source_url} url={p.source_url}>
            Earth elevation samples
          </SourceLink>
        ))}
        {target.source_refs.slice(0, 1).map((p) => (
          <SourceLink key={p.url} url={p.url}>
            Planetary dataset & labels
          </SourceLink>
        ))}
      </div>
    </section>
  );
}
export function UtilityPanel({ assessment }: { assessment: Assessment }) {
  return (
    <section className="science-section">
      <div className="section-heading">
        <h2>Mission utility & evidence</h2>
        <EvidenceTag kind="ASSUMED" />
      </div>
      <p className="section-intro">
        Declared experimental screening heuristics. Missing criteria stay null.
        The assessed weights determine coverage, not confidence.
      </p>
      {Object.entries(assessment.utility.criteria).map(([key, c]) => (
        <div className="criterion-row" key={key}>
          <div className="criterion-top">
            <strong>
              {key === "geology"
                ? "Geological/process relevance"
                : key === "terrain"
                  ? "Terrain fieldwork suitability"
                  : key === "aridity"
                    ? "Dry Earth operating conditions"
                    : "Earth thermal operating context"}
            </strong>
            <span className="mono">
              {number(c.value == null ? null : c.value * 100, 0)} /100 · w=
              {assessment.utility.weights[key]}
            </span>
          </div>
          <div className="feature-track">
            <span style={{ width: `${(c.value ?? 0) * 100}%` }} />
          </div>
          <p>{c.rationale}</p>
          <div className="source-row">
            <EvidenceTag kind={c.classification} />
            {c.source_refs.slice(0, 2).map((url, i) => (
              <SourceLink key={url} url={url}>
                Evidence {i + 1}
              </SourceLink>
            ))}
          </div>
        </div>
      ))}
      <p className="caption">{assessment.utility.note}</p>
      <div className="priority-line">
        <span>Optional combined screening priority P</span>
        <strong className="mono">{number(assessment.priority, 1)}</strong>
        <small>
          {assessment.priority == null
            ? "Not calculated: fidelity or evidence requirements unmet."
            : `(αF + (1−α)U) × C; α=${assessment.alpha}. Model choice, not empirical calibration.`}
        </small>
      </div>
    </section>
  );
}
export function GeologyPanel({ candidate }: { candidate: Candidate }) {
  return (
    <section className="science-section">
      <div className="section-heading">
        <h2>Geological evidence</h2>
        <EvidenceTag kind="LITERATURE-SUPPORTED" />
      </div>
      {candidate.material_process ? <p>{candidate.material_process}</p> : null}
      {candidate.geology.units.length ? (
        candidate.geology.units.map((u, i) => (
          <div className="geological-unit" key={i}>
            <h3>{String(u.name ?? "Unnamed mapped unit")}</h3>
            <p>{String(u.lith ?? "Lithology not specified")}</p>
            <p>{String(u.descrip ?? "")}</p>
            <dl>
              <div>
                <dt>Geological age</dt>
                <dd>
                  {String(u.best_int_name ?? "Unknown")}
                  {u.t_age != null ? ` · ${u.t_age}–${u.b_age}Ma` : ""}
                </dd>
              </div>
              <div>
                <dt>Map scale class</dt>
                <dd>{String(u.scale ?? "Unavailable")}</dd>
              </div>
              <div>
                <dt>Map / source ID</dt>
                <dd>
                  {String(u.map_id ?? "—")} / {String(u.source_id ?? "—")}
                </dd>
              </div>
            </dl>
            {candidate.geology.references &&
            typeof candidate.geology.references === "object" ? (
              <p className="citation">
                {String(
                  (candidate.geology.references as Record<string, unknown>)[
                    String(u.source_id)
                  ] ?? "Original map citation unavailable",
                )}
              </p>
            ) : null}
          </div>
        ))
      ) : (
        <p>
          Geology requires verification. Macrostrat returned no conclusive
          mapped unit here.
        </p>
      )}
      <p className="scientific-warning">
        {candidate.geology.caution ??
          "Mapped lithology does not establish field mineralogy. Geological support remains a preliminary interpretation."}
      </p>
      <div className="source-row">
        {candidate.geology.source_refs.map((url) => (
          <SourceLink key={url} url={url}>
            Macrostrat map response
          </SourceLink>
        ))}
      </div>
    </section>
  );
}
export function RealityGapPanel({ assessment }: { assessment: Assessment }) {
  const gap = assessment.reality_gap;
  return (
    <section className="science-section reality-gap">
      <h2>Reality gap</h2>
      <p className="section-intro">
        Useful for an experiment does not mean physically equivalent to another
        world.
      </p>
      <div className="gap-grid">
        {[
          ["Match", gap.match],
          ["Mission use", [gap.mission_use]],
          ["Mismatch", gap.mismatch],
          ["Missing", gap.missing],
        ].map(([title, items]) => (
          <div key={String(title)}>
            <h3>{title}</h3>
            <ul>
              {(items as string[]).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="equation">{gap.force_model}</div>
      <p>{gap.conclusion}</p>
    </section>
  );
}
export function ExperimentPanel({ assessment }: { assessment: Assessment }) {
  const e = assessment.experiment;
  return (
    <section className="science-section experiment-panel">
      <div className="section-heading">
        <h2>Field experiment briefing</h2>
        <EvidenceTag kind="ASSUMED" />
      </div>
      <p className="experiment-gate">{e.evidence_gate}</p>
      <h3>Testable hypothesis</h3>
      <p>{e.hypothesis}</p>
      <h3>Mission objective</h3>
      <p>{e.objective}</p>
      <h3>Why this site may be useful</h3>
      <p>{e.why_useful}</p>
      <div className="two-column">
        <div>
          <h3>Equipment & method</h3>
          <ul>
            {e.equipment.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Collect these measurements</h3>
          <ul>
            {e.measurements.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3>Proposed success indicator</h3>
      <p>{e.success_indicator}</p>
      <h3>Next field measurement</h3>
      <p>{e.next_measurement}</p>
      <p className="scientific-warning">{e.unvalidated}</p>
    </section>
  );
}
