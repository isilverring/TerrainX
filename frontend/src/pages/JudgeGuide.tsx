import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useData, number } from "../lib/data";
import { useScienceFile } from "../lib/scienceFile";
import { cellSearchSchema } from "../lib/cellSearch";
import { siteEvidenceSchema } from "../lib/siteEvidence";
import {
  fieldSitesSchema,
  expandedCollection,
  studyPath,
} from "../lib/collections";
import { applyScenarios, useModel } from "../lib/scoring";
import type { Mission } from "../lib/models";
import { ScoreStrip } from "../components/ui";
import SiteEvidence from "../components/SiteEvidence";
const steps = [
  "The challenge",
  "The searched sample",
  "An exploratory lead",
  "Evidence and limits",
  "The next experiment",
];
export default function JudgeGuide() {
  const data = useData(),
    model = useModel(),
    [step, setStep] = useState(0),
    [mission, setMission] = useState<Mission>("mare-crisium");
  const cells = useScienceFile(
    "cell_search.json",
    cellSearchSchema,
    "This guide requires the expanded search in its pinned release.",
  );
  const cases = useScienceFile(
    "site_evidence.json",
    siteEvidenceSchema,
    "This guide's scoped cases are unavailable in this release.",
  );
  const sites = useScienceFile(
    "field_candidates.json",
    fieldSitesSchema,
    "This guide's cell profiles are unavailable in this release.",
  );
  const complete = useMemo(
    () =>
      sites.value
        ? applyScenarios(
            expandedCollection(data, sites.value.candidates),
            model.scenarios,
          )
        : null,
    [data, sites.value, model.scenarios],
  );
  const item = cases.value?.cases.find((c) => c.mission === mission),
    candidate = complete?.candidates.find((c) => c.id === item?.candidate_id),
    row = cells.value?.rows.find((c) => c.id === candidate?.id);
  const href = (path: string) =>
    studyPath(
      path,
      `science=${data.release?.release_id}&cohort=expanded&mission=${mission}&polar=none`,
    );
  const error = cells.error || cases.error || sites.error;
  if (!candidate || !row || !item || !cells.value)
    return (
      <main className="document-page guide-page">
        <h1>
          {error
            ? "This judge path is unavailable in the pinned release"
            : "Validating the judge's science path…"}
        </h1>
        {error && <p role="alert">{error} No newer science substituted.</p>}
      </main>
    );
  return (
    <main
      className="document-page guide-page"
      onKeyDown={(e) => {
        if (
          e.defaultPrevented ||
          /INPUT|SELECT|TEXTAREA|BUTTON|A/.test(
            (e.target as HTMLElement).tagName,
          )
        )
          return;
        if (e.key === "ArrowRight") setStep((s) => Math.min(4, s + 1));
        if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      }}
    >
      <header className="document-title">
        <div>
          <p className="document-label">
            Start here · five decisions · manual judge path
          </p>
          <h1>From a search cell to a testable field question.</h1>
          <p>
            Follow real observations, a bounded hypothesis and the measurement
            needed next. No universal winner or validated field discovery is
            claimed.
          </p>
        </div>
      </header>
      <div className="guide-missions" role="group" aria-label="Judge case">
        <button
          className={`button ${mission === "mare-crisium" ? "primary" : "outline"}`}
          onClick={() => setMission("mare-crisium")}
        >
          Moon · volcanic fieldwork
        </button>
        <button
          className={`button ${mission === "jezero" ? "primary" : "outline"}`}
          onClick={() => setMission("jezero")}
        >
          Mars · sedimentary evidence gap
        </button>
      </div>
      <nav className="guide-steps" aria-label="Judge path steps">
        {steps.map((s, i) => (
          <button
            key={s}
            aria-current={step === i ? "step" : undefined}
            onClick={() => setStep(i)}
          >
            <span>0{i + 1}</span>
            {s}
          </button>
        ))}
      </nav>
      <section
        className="guide-scene"
        tabIndex={0}
        aria-label={`Step ${step + 1}: ${steps[step]}`}
      >
        <p className="document-label">
          {step + 1} / 5 · {steps[step]}
        </p>
        {step === 0 && (
          <>
            <h2>Where on Earth can we rehearse exploration?</h2>
            <p>
              The NASA challenge asks us to identify and characterize useful
              terrestrial analogs with open Earth, Moon and Mars data, explain
              what matches and fails to match, and connect the evidence to an
              exploration experiment.
            </p>
            <p>
              One useful, well-supported question can matter. Every suggested
              environment and partner dataset is not a mandatory requirement.
            </p>
            <a
              className="source-link"
              href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
              target="_blank"
              rel="noreferrer"
            >
              Read the official challenge
            </a>
          </>
        )}
        {step === 1 && (
          <>
            <h2>{cells.value.cells} screened cells. Four bounded regions.</h2>
            <p>
              NASA POWER supplied the regional search and point climatology.
              SRTM supplies the coarse terrain samples; mapped geology adds
              regional context. The original 16-candidate study and
              expanded 130-cell collection are explicitly separate.
            </p>
            <p>
              {cells.value.missions[mission].shortlist.length} geographically
              separated picks under this mission's declared model. Benchmarks
              never count as new discoveries.
            </p>
            <Link className="button outline" to={href("/cells")}>
              Inspect all screened cells
            </Link>
          </>
        )}
        {step === 2 && (
          <>
            <h2>{candidate.name}</h2>
            <p className="mono">
              {candidate.latitude.toFixed(3)}°, {candidate.longitude.toFixed(3)}
              ° · 24 km terrain window /4 km sampling
            </p>
            <p>
              Exploratory research candidate in this screened sample. Its
              cached default-model rank is{" "}
              {row.missions[mission].rank ?? "unassessed"}; it is selected here
              to illustrate a scientific decision, not as a universal winner.
            </p>
            <ScoreStrip assessment={candidate.assessments[mission]} />
            <p>
              F compares broad-scale terrain; U describes a declared Earth
              experiment model; C reports assessed criterion weight. NASA POWER
              annual precipitation proxy: {number(row.annual_precip_mm, 1)}{" "}
              mm/year. Mapped lithology: {row.geology.lith ?? "unavailable"},
              requiring field verification.
            </p>
            <Link className="button outline" to={href(`/site/${candidate.id}`)}>
              Inspect Analog DNA and source-support sensitivity
            </Link>
          </>
        )}
        {step === 3 && (
          <>
            <h2>A useful result includes its contradictions.</h2>
            <SiteEvidence id={candidate.id} />
          </>
        )}
        {step === 4 && (
          <>
            <h2>Propose the next measurement.</h2>
            <p>{item.next_measurement}</p>
            <p>{item.experiment.hypothesis}</p>
            <p>{item.experiment.success_indicator}</p>
            <p className="scientific-caveat">
              All stations and protocols are proposals. Access, local exposure,
              material properties and outcomes remain unvalidated. Earth cannot
              reproduce lunar or Martian gravity, atmosphere and radiation in
              full.
            </p>
            <div className="toolbar-actions">
              <Link
                className="button primary"
                to={href(`/field-study?id=${candidate.id}&protocol=source`)}
              >
                Prepare this field proposal
              </Link>
              <Link
                className="button outline"
                to={href(`/expedition/${candidate.id}`)}
              >
                Open Expedition Packet
              </Link>
              <Link
                className="button outline"
                to={href("/lunar-pole?site=haworth")}
              >
                Explore the separate polar workflow
              </Link>
            </div>
          </>
        )}
      </section>
      <div className="guide-controls">
        <button
          className="button outline"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          Previous
        </button>
        <span>{step + 1} / 5</span>
        <button
          className="button primary"
          disabled={step === 4}
          onClick={() => setStep((s) => s + 1)}
        >
          Next
        </button>
      </div>
      <p className="caption">
        Use the longer Guided demo for a manual audience narrative. Research
        tools retain the advanced science workspaces. Science release{" "}
        {data.release?.release_id}.
      </p>
    </main>
  );
}
