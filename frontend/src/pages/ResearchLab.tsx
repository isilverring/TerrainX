import { Link, useSearchParams } from "react-router-dom";
import { FlaskConical, ArrowUpRight, Database, FileCheck2 } from "lucide-react";
import { useData, coordinates, statusName } from "../lib/data";
import type { Mission } from "../lib/models";
import { studyPath } from "../lib/collections";
import { useScienceFile } from "../lib/scienceFile";
import {
  LAB_MODULES,
  challengeEvidenceSchema,
  dailyExtremesSchema,
  illuminationSchema,
  operationsSchema,
  type LabModule,
} from "../lib/researchLab";
import { BackLink, Loading } from "../components/ui";
import {
  Minerals,
  Resources,
  Biology,
  Caves,
} from "../components/research-lab/EvidenceModules";
import { Thermal, Dust } from "../components/research-lab/PhysicalModules";
import Operations from "../components/research-lab/OperationsModule";
import Base from "../components/research-lab/BaseModule";
import "../styles/research-lab.css";

export default function ResearchLab() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const active = (
    LAB_MODULES.some((m) => m.id === params.get("module"))
      ? params.get("module")
      : "mineralogy"
  ) as LabModule;
  const module = LAB_MODULES.find((m) => m.id === active)!;
  const available = !!data.release?.files["challenge_evidence.json"];
  const evidence = useScienceFile(
    "challenge_evidence.json",
    challengeEvidenceSchema,
    "This historical release has no Research Lab evidence registry. No newer evidence was substituted.",
    available,
  );
  const light = useScienceFile(
    "lunar_illumination.json",
    illuminationSchema,
    "Lunar illumination is unavailable in this pinned release.",
    available && (active === "illumination" || active === "base"),
  );
  const operations = useScienceFile(
    "operations_terrain.json",
    operationsSchema,
    "Refined operations lattices are unavailable in this pinned release.",
    available && active === "operations",
  );
  const extremes = useScienceFile(
    "climate_extremes.json",
    dailyExtremesSchema,
    "Daily extremes are unavailable in this pinned release.",
    available && active === "illumination",
  );
  const defaults: Record<LabModule, string> = {
    mineralogy: "reference-salda",
    biology: "reference-atacama",
    resources: "reference-salda",
    caves: "reference-craters",
    illumination: "saudi-24.000-39.375",
    dust: "saudi-24.000-39.375",
    operations: "saudi-24.000-39.375",
    base: "chile--23.000--70.000",
  };
  const requested =
    params.get("id") ?? params.get("atlas_id") ?? defaults[active];
  const candidate = data.candidates.find((c) => c.id === requested);
  const mission: Mission =
    active === "base" || params.get("mission") === "mare-crisium"
      ? "mare-crisium"
      : "jezero";
  const update = (key: string, value: string) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.set(key, value);
      if (key === "id") next.set("atlas_id", value);
      return next;
    });
  if (!available)
    return (
      <main className="document-page lab-page">
        <BackLink mission={mission} />
        <h1>Research Lab unavailable in this historical release.</h1>
        <p>
          This pinned release predates the new evidence and calculated products.
          No newer measurements or model outputs were substituted.
        </p>
        <a
          className="button primary"
          target="_blank"
          rel="noreferrer"
          href={`${window.location.origin}${window.location.pathname}#/research-lab?module=${active}&cohort=expanded&polar=none`}
        >
          Open the current lab explicitly
          <ArrowUpRight size={16} />
        </a>
      </main>
    );
  if (!candidate)
    return (
      <main className="document-page lab-page">
        <h1>Requested research site is unavailable</h1>
        <p>
          The candidate is outside this collection. No substitute site was
          opened.
        </p>
        <Link
          className="button outline"
          to={studyPath(
            `/research-lab?module=${active}&id=${defaults[active]}&cohort=expanded&polar=none`,
            params.toString(),
          )}
        >
          Use this tool's stated reference site
        </Link>
      </main>
    );
  const context = {
    candidate,
    mission,
    onCandidate: (id: string) => update("id", id),
  };
  return (
    <main className="document-page lab-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">
            <FlaskConical size={14} /> Mission Research Lab · resolve the
            evidence gap
          </p>
          <h1>Turn an evidence gap into a test.</h1>
          <p>
            Find what is supported, explore a declared model, and decide what to
            measure next. These tools address the challenge's partially
            characterized environments; they do not manufacture field
            confirmation.
          </p>
        </div>
        <Link
          className="button outline"
          to={studyPath("/challenge", params.toString())}
        >
          Challenge coverage
          <ArrowUpRight size={15} />
        </Link>
      </header>
      <section className="lab-context" aria-label="Research question context">
        <label className="lab-input">
          Earth research candidate
          <select
            value={candidate.id}
            onChange={(e) => update("id", e.target.value)}
          >
            {data.candidates.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
                {c.benchmark ? " · benchmark" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="lab-input">
          Mission focus
          <select
            value={mission}
            disabled={active === "base"}
            onChange={(e) => update("mission", e.target.value)}
          >
            <option value="jezero">Mars · geological science</option>
            <option value="mare-crisium">Moon · surface operations</option>
          </select>
        </label>
        <div className="lab-context-note">
          <span className="mono">{coordinates(candidate)}</span>
          <span>
            {statusName(candidate.assessments[mission].utility.status)}
          </span>
          <small>
            F/U/C are preserved. Source-scoped references and scenarios do not
            upgrade a site's evidence.
          </small>
        </div>
      </section>
      <div className="lab-layout">
        <aside className="lab-sidebar">
          <nav aria-label="Research Lab tools">
            {LAB_MODULES.map((m, i) => (
              <Link
                key={m.id}
                aria-current={active === m.id ? "page" : undefined}
                to={studyPath(
                  `/research-lab?module=${m.id}&id=${candidate.id}${m.id === "base" ? "&mission=mare-crisium" : ""}`,
                  params.toString(),
                )}
              >
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <span>{m.title}</span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </nav>
          <div className="lab-data-note">
            <Database size={16} />
            <p>Pinned scientific release</p>
            <code>{data.release?.release_id}</code>
            <small>
              New tools use their declared data support; no change to baseline
              ranking or field validation.
            </small>
          </div>
          <Link
            className="lab-source-link"
            to={studyPath(
              `/passport/${candidate.id}?mission=${mission}`,
              params.toString(),
            )}
          >
            <FileCheck2 size={16} />
            Open this candidate's Passport
          </Link>
        </aside>
        <div className="lab-content">
          <div className="lab-active-question">
            <span className="document-label">{module.title}</span>
            <h2>{module.question}</h2>
            <small>
              Export a research decision to retain the scenario and its
              evidence. User-entered values are not automatically treated as
              NASA observations.
            </small>
          </div>
          {evidence.error ? (
            <p role="alert" className="lab-error">
              {evidence.error}
            </p>
          ) : !evidence.value ? (
            <Loading message="Validating source-scoped research evidence…" />
          ) : (
            <>
              {active === "mineralogy" && (
                <Minerals {...context} records={evidence.value.records} />
              )}
              {active === "resources" && (
                <Resources {...context} records={evidence.value.records} />
              )}
              {active === "biology" && (
                <Biology {...context} records={evidence.value.records} />
              )}
              {active === "caves" && (
                <Caves {...context} records={evidence.value.records} />
              )}
              {active === "dust" && <Dust {...context} />}
              {active === "illumination" && (
                <Thermal
                  {...context}
                  light={light.value?.sites}
                  lightError={light.error ?? undefined}
                  extremes={extremes.value ?? undefined}
                />
              )}
              {active === "operations" &&
                (operations.value || operations.error ? (
                  <Operations
                    {...context}
                    profiles={operations.value?.profiles}
                    error={operations.error ?? undefined}
                  />
                ) : (
                  <Loading message="Validating measured route lattices…" />
                ))}
              {active === "base" && (
                <Base
                  {...context}
                  sites={light.value?.sites}
                  error={light.error ?? undefined}
                  initialLunarId={params.get("lunar") ?? undefined}
                />
              )}
            </>
          )}
          <section className="lab-boundary">
            <h2>What this resolves</h2>
            <p>
              A reproducible next experiment, with its evidence and assumptions
              attached. Exact outcrop mineralogy, cave surveys, microbial field
              assays, resource reserves and mission-certified engineering still
              require the appropriate measurements. An Earth experiment can be
              useful without reproducing another world.
            </p>
            <Link to={studyPath("/methodology", params.toString())}>
              Read the scientific contracts
              <ArrowUpRight size={13} />
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
