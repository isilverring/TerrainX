import { useEffect, useRef, useState } from "react";
import type { Candidate, Mission } from "../lib/models";
import { evidenceFacts } from "../lib/evidence";
import type { EvidenceFact } from "../lib/evidence";
import { number } from "../lib/data";
import { EvidenceTag, SourceLink } from "./ui";
import { Search, X } from "lucide-react";

export function EvidenceButton({
  fact,
  children,
}: {
  fact: EvidenceFact;
  children?: React.ReactNode;
}) {
  const labelId = `fact-${fact.id.replace(/[^A-Za-z0-9_-]/g, "-")}`;
  const [open, setOpen] = useState(false),
    dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
    } else if (dialog.current?.open) dialog.current.close();
  }, [open]);
  const close = () => {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        className="fact-trigger"
        onClick={() => setOpen(true)}
        aria-label={`Inspect evidence: ${fact.label}`}
      >
        {children ?? (
          <>
            <Search size={14} />
            Inspect evidence
          </>
        )}
      </button>
      {open ? (
        <dialog
          ref={dialog}
          className="evidence-dialog"
          onCancel={(e) => {
            e.preventDefault();
            close();
          }}
          aria-labelledby={labelId}
        >
          <div className="evidence-dialog-head">
            <EvidenceTag kind={fact.kind} />
            <button
              className="icon-button"
              onClick={close}
              aria-label="Close evidence inspector"
            >
              <X size={20} />
            </button>
          </div>
          <h2 id={labelId}>{fact.label}</h2>
          <p className="fact-reading mono">
            {number(fact.value, 3)} <small>{fact.unit}</small>
          </p>
          <dl className="evidence-metadata">
            {[
              ["Spatial applicability", fact.scope],
              ["Acquisition period", fact.period],
              ["Retrieved UTC", fact.retrieved],
              ["Resolution / scale", fact.resolution],
              ["Calculation", fact.formula],
              ["Inputs / interpretation", fact.inputs],
              ["Source response SHA-256", fact.hash],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <h3>Interpretation limits</h3>
          <ul>
            {fact.limitations.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="reference-list">
            {fact.sources.map((url, i) => (
              <SourceLink key={url} url={url}>
                Source {i + 1} · {new URL(url).hostname}
              </SourceLink>
            ))}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
function Footprints({ candidate: c }: { candidate: Candidate }) {
  const kmPerDegree = (Math.PI * 6371) / 180,
    width = 0.625 * kmPerDegree * Math.cos((c.latitude * Math.PI) / 180),
    height = 0.5 * kmPerDegree,
    span = Math.max(width, height, 24) * 1.35,
    scale = 300 / span,
    terrain =
      c.terrain.status === "available" && c.terrain.footprint_m
        ? c.terrain.footprint_m / 1000
        : null;
  return (
    <figure className="footprint-figure">
      <svg
        viewBox="0 0 500 260"
        role="img"
        aria-label="Approximate NASA POWER support, actual terrain analysis width and query anchor; not authoritative grid boundaries"
      >
        <rect
          x={250 - (width * scale) / 2}
          y={125 - (height * scale) / 2}
          width={width * scale}
          height={height * scale}
          fill="#35c3b012"
          stroke="#35c3b0"
          strokeDasharray="5 4"
        />
        {terrain !== null && (
          <rect
            x={250 - (terrain * scale) / 2}
            y={125 - (terrain * scale) / 2}
            width={terrain * scale}
            height={terrain * scale}
            fill="#c6d7e810"
            stroke="#c6d7e8"
          />
        )}
        {terrain
          ? Array.from({ length: 49 }, (_, i) => (
              <circle
                key={i}
                cx={250 + ((((i % 7) - 3) * terrain) / 6) * scale}
                cy={125 + (((Math.floor(i / 7) - 3) * terrain) / 6) * scale}
                r="2"
                fill="#c6d7e8"
              />
            ))
          : null}
        <circle cx="250" cy="125" r="5" fill="#f17e5a" />
        <text x="250" y="244" textAnchor="middle" fill="#97a8bd" fontSize="12">
          Query anchor ·{" "}
          {terrain === null
            ? "terrain footprint unavailable"
            : `${number(terrain, 0)} km terrain footprint`}
        </text>
      </svg>
      <figcaption>
        POWER meteorological support ≈{number(width, 1)} × {number(height, 1)}{" "}
        km at this latitude. Placement is schematic, not an authoritative pixel
        boundary. Geology is queried at the anchor; its polygon extent is not
        available in this cached response. Solar support differs (1° × 1°).
      </figcaption>
    </figure>
  );
}
export default function EvidenceInspector({
  candidate,
  mission,
}: {
  candidate: Candidate;
  mission: Mission;
}) {
  const facts = evidenceFacts(candidate, mission);
  return (
    <section
      className="science-section evidence-inspector"
      id="evidence-inspector"
    >
      <div className="section-heading">
        <h2>Evidence Inspector</h2>
        <EvidenceTag kind="SOURCE-LINKED" />
      </div>
      <p className="section-intro">
        Follow a value to its source, calculation and spatial limits. Coverage C
        is the assessed share of model weights; it is not evidence strength,
        confidence or field verification.
      </p>
      <Footprints candidate={candidate} />
      <div className="evidence-facts">
        {facts.map((f) => (
          <article key={f.id}>
            <div>
              <span>{f.label}</span>
              <strong className="mono">
                {number(f.value, 2)} <small>{f.unit}</small>
              </strong>
            </div>
            <EvidenceButton fact={f} />
          </article>
        ))}
      </div>
    </section>
  );
}
