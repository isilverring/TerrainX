import { lazy, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useData, coordinates, statusName } from "../lib/data";
import type { Mission } from "../lib/models";
import { scienceAssetUrl } from "../lib/release";
import {
  BackLink,
  EvidenceTag,
  ScoreStrip,
  SiteActions,
  SourceLink,
} from "../components/ui";
import {
  ObservationPanel,
  TerrainPanel,
  UtilityPanel,
  GeologyPanel,
  RealityGapPanel,
  ExperimentPanel,
} from "../components/SciencePanels";
const TerrainViewer = lazy(() => import("../components/TerrainViewer"));
const EvidenceInspector = lazy(() => import("../components/EvidenceInspector"));
export default function SiteDetail() {
  const data = useData(),
    { id } = useParams(),
    [params] = useSearchParams();
  const mission: Mission =
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const c = data.candidates.find((c) => c.id === id),
    target = data.targets.find((t) => t.id === mission)!;
  if (!c)
    return (
      <main className="document-page">
        <h1>Candidate not found</h1>
        <Link to="/explorer">Return to atlas</Link>
      </main>
    );
  const a = c.assessments[mission];
  return (
    <main className="document-page detail-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">
            Analog DNA · {target.body} / {target.name}
          </p>
          <h1>{c.name}</h1>
          <p className="mono">{coordinates(c)} · 24 × 24 km terrain analysis</p>
          <div className="identity-tags">
            <EvidenceTag
              kind={c.benchmark ? "LITERATURE-SUPPORTED" : "DERIVED"}
            />
            <span>{statusName(a.utility.status)}</span>
          </div>
        </div>
        <SiteActions id={c.id} mission={mission} />
      </header>
      <ScoreStrip assessment={a} />
      <p className="score-explainer">
        F is exploratory terrain fidelity. U is model-based Earth experiment
        suitability. C is evidence coverage. These are separate concepts, never
        a probability of mission success.
      </p>
      <div className="detail-nav">
        {[
          ["observations", "Observations"],
          ["evidence-inspector", "Evidence Inspector"],
          ["terrain", "Terrain DNA"],
          ["terrain-3d", "Forensics"],
          ["geology", "Geology"],
          ["reality-gap", "Reality gap"],
          ["field-experiment", "Experiment"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() =>
              document.getElementById(id)?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
              })
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div id="observations">
        <ObservationPanel candidate={c} />
      </div>
      <Suspense fallback={<p>Loading source inspector…</p>}>
        <EvidenceInspector candidate={c} mission={mission} />
      </Suspense>
      <div id="terrain">
        <TerrainPanel candidate={c} target={target} assessment={a} />
      </div>
      <div id="terrain-3d">
        <Suspense
          fallback={<p className="viewer-empty">Loading 3D terrain viewer…</p>}
        >
          <TerrainViewer candidate={c} target={target} assessment={a} />
        </Suspense>
      </div>
      <UtilityPanel assessment={a} />
      <div id="geology">
        <GeologyPanel candidate={c} />
      </div>
      <div id="reality-gap">
        <RealityGapPanel assessment={a} />
      </div>
      <div id="field-experiment">
        <ExperimentPanel assessment={a} />
      </div>
      <section className="science-section">
        <h2>Provenance & scientific references</h2>
        <p>
          Dataset generated{" "}
          {new Date(data.generated_at).toLocaleString("en-GB")}. Original units,
          acquisition period, retrieval timestamp, coordinates and source hashes
          are preserved in the downloadable data.
        </p>
        <div className="reference-list">
          {c.source_refs.map((url, i) => (
            <SourceLink key={url} url={url}>
              Source {i + 1} · {new URL(url).hostname}
            </SourceLink>
          ))}
        </div>
        <Link
          className="button outline"
          to={`/research?mission=${mission}&id=${c.id}`}
        >
          Save research snapshot
        </Link>
        <a
          className="button outline"
          href={scienceAssetUrl("dataset.json")}
          download
        >
          Download scientific dataset
          <ArrowRight size={16} />
        </a>
      </section>
      <Link
        className="button primary"
        to={`/passport/${c.id}?mission=${mission}`}
      >
        Prepare Analog Passport
        <ArrowRight size={18} />
      </Link>{" "}
      <Link
        className="button outline"
        to={`/field-study?id=${c.id}&mission=${mission}`}
      >
        Plan a field study
        <ArrowRight size={18} />
      </Link>
    </main>
  );
}
