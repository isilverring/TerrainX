import { Link, useLocation } from "react-router-dom";
import { Compass, FlaskConical, ScanSearch } from "lucide-react";
import type { Mission } from "../lib/models";
import { studyPath } from "../lib/collections";

/** Navigation stages describe tasks, never evidence completeness. */
export default function ResearchTrail({
  id,
  mission,
  stage,
  scenario,
}: {
  id?: string;
  mission: Mission;
  stage: "discover" | "inspect" | "prepare";
  scenario?: unknown;
}) {
  const { search } = useLocation();
  const candidate = id
    ? `&id=${encodeURIComponent(id)}&atlas_id=${encodeURIComponent(id)}`
    : "";
  const steps = [
    {
      key: "discover",
      label: "Discover",
      short: "Discover",
      icon: Compass,
      path: `/explorer?mission=${mission}${candidate}`,
    },
    {
      key: "inspect",
      label: "Inspect evidence",
      short: "Evidence",
      icon: ScanSearch,
      path: id
        ? `/site/${id}?mission=${mission}&atlas_id=${encodeURIComponent(id)}`
        : null,
    },
    {
      key: "prepare",
      label: "Prepare experiment",
      short: "Prepare",
      icon: FlaskConical,
      path: id
        ? `/field-study?mission=${mission}${candidate}${new URLSearchParams(search).get("protocol") === "source" ? "&protocol=source" : ""}`
        : null,
    },
  ];
  return (
    <nav className="research-trail" aria-label="Candidate research workflow">
      <span className="trail-caption">From evidence to experiment</span>
      <ol>
        {steps.map((step, i) => {
          const Icon = step.icon;
          const content = (
            <>
              <span className="trail-number mono">0{i + 1}</span>
              <Icon size={15} aria-hidden="true" />
              <span className="trail-full">{step.label}</span>
              <span className="trail-short">{step.short}</span>
            </>
          );
          return (
            <li key={step.key}>
              {step.path ? (
                <Link
                  to={studyPath(
                    step.path +
                      (scenario
                        ? `&model=${encodeURIComponent(JSON.stringify(scenario))}`
                        : ""),
                    search,
                  )}
                  aria-current={stage === step.key ? "step" : undefined}
                >
                  {content}
                </Link>
              ) : (
                <span
                  className="trail-disabled"
                  title="Select an Earth candidate first"
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
