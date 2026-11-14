import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Braces,
  FileSpreadsheet,
  MapPinned,
  PackageOpen,
  Printer,
} from "lucide-react";
import { useMemo, useEffect } from "react";
import { useModel, validScenario } from "../lib/scoring";
import {
  APP,
  buildPacket,
  download,
  packetCsv,
  packetGeoJSON,
} from "../lib/packet";
import QrCode from "../components/QrCode";
import { MeasureNext } from "../components/FrontierParts";
import { frontier } from "../lib/frontier";
import { useData, coordinates, statusName } from "../lib/data";
import type { Mission } from "../lib/models";
import {
  BackLink,
  EvidenceTag,
  ScoreStrip,
  SourceLink,
} from "../components/ui";
import {
  ObservationPanel,
  TerrainPanel,
  GeologyPanel,
  RealityGapPanel,
  ExperimentPanel,
  UtilityPanel,
} from "../components/SciencePanels";
export default function Passport({ packet = false }: { packet?: boolean }) {
  const data = useData(),
    { id } = useParams(),
    [params] = useSearchParams();
  const mission: Mission =
    params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
  const c = data.candidates.find((c) => c.id === id);
  if (!c)
    return (
      <main className="document-page">
        <h1>Candidate not found</h1>
        <Link to="/explorer">Return to atlas</Link>
      </main>
    );
  return <PassportBody packet={packet} candidateId={c.id} mission={mission} />;
}

function PassportBody({
  packet,
  candidateId,
  mission,
}: {
  packet: boolean;
  candidateId: string;
  mission: Mission;
}) {
  const data = useData();
  const model = useModel();
  const [params] = useSearchParams();
  const incomingModel = params.get("model");
  useEffect(() => {
    try {
      const incoming = JSON.parse(incomingModel ?? "null");
      if (validScenario(incoming)) model.update(mission, incoming);
    } catch {
      /* Invalid shared model is ignored. */
    }
  }, [incomingModel, mission]);
  const c = data.candidates.find((x) => x.id === candidateId)!,
    target = data.targets.find((t) => t.id === mission)!,
    a = c.assessments[mission];
  const pkt = useMemo(() => buildPacket(data, c, mission), [data, c, mission]);
  const base = `terrainx-${c.id}-${mission}`;
  const sharedParams = new URLSearchParams({
    cohort: data.collection ?? "original",
    mission,
    model: JSON.stringify(model.scenarios[mission]),
  });
  if (data.release) sharedParams.set("science", data.release.release_id);
  if(data.target_reference)sharedParams.set("polar",data.target_reference.replace("lunar-polar:",""));
  if (data.release) sharedParams.set("datahash", data.release.dataset_sha256);
  if (params.get("presentation") === "1") sharedParams.set("presentation", "1");
  const sharedUrl = `${window.location.origin}${window.location.pathname}#/${packet ? "expedition" : "passport"}/${c.id}?${sharedParams}`;
  return (
    <main
      className={`document-page passport-page ${packet ? "packet-page" : ""}`}
    >
      <div className="passport-toolbar">
        <BackLink mission={mission} />
        <div className="toolbar-actions">
          {packet ? (
            <>
              <button
                className="button outline"
                onClick={() =>
                  download(
                    `${base}.json`,
                    JSON.stringify(pkt, null, 2),
                    "application/json",
                  )
                }
              >
                <Braces size={16} /> JSON
              </button>
              <button
                className="button outline"
                onClick={() =>
                  download(`${base}.csv`, packetCsv(pkt), "text/csv")
                }
              >
                <FileSpreadsheet size={16} /> CSV
              </button>
              <button
                className="button outline"
                onClick={() =>
                  download(
                    `${base}.geojson`,
                    JSON.stringify(packetGeoJSON(pkt), null, 2),
                    "application/geo+json",
                  )
                }
              >
                <MapPinned size={16} /> GeoJSON
              </button>
            </>
          ) : (
            <Link
              className="button outline"
              to={`/expedition/${c.id}?mission=${mission}`}
            >
              <PackageOpen size={16} /> Generate Expedition Packet
            </Link>
          )}
          <button className="button primary" onClick={() => window.print()}>
            <Printer size={17} />
            Print / Save as PDF
          </button>
        </div>
      </div>
      <header className="passport-header">
        <div>
          <img
            className="passport-brand-mark"
            src="/brand/terrainx-mark.svg"
            alt="TerrainX orbital X"
            width="70"
            height="63"
          />
          <p className="document-label">
            TerrainX /{" "}
            {packet ? "Expedition research brief" : "Scientific field briefing"}
          </p>
          <h1>{packet ? "EXPEDITION PACKET" : "ANALOG PASSPORT"}</h1>
          <p>Planetary Analog Discovery & Mission Readiness Lab</p>
          {packet ? <p className="packet-challenge">{APP.challenge}</p> : null}
        </div>
        <div className="passport-number mono">
          {c.id}
          <br />
          DATA {new Date(data.generated_at).toISOString().slice(0, 10)}
          <br />
          PRELIMINARY · NO FIELD VALIDATION
        </div>
      </header>
      <section className="passport-identity">
        <h2>{c.name}</h2>
        <p className="mono">{coordinates(c)}</p>
        <p>
          {c.coordinate_scope ??
            "Automatically selected NASA POWER cell center. Field subsite not yet chosen or surveyed."}
        </p>
        <dl>
          <div>
            <dt>Reference target</dt>
            <dd>
              {target.body} / {target.name} ({target.latitude}°N,
              {target.longitude}°E)
            </dd>
          </div>
          <div>
            <dt>Discovery status</dt>
            <dd>
              {statusName(a.utility.status)}
              {c.benchmark
                ? " · benchmark, never counted as a new discovery"
                : ""}
            </dd>
          </div>
          <div>
            <dt>Terrain footprint</dt>
            <dd>24 × 24 km · 7 × 7 samples · 4 km spacing</dd>
          </div>
          <div>
            <dt>Evidence status</dt>
            <dd>{a.utility.evidence_label}</dd>
          </div>
        </dl>
        <EvidenceTag kind={c.benchmark ? "LITERATURE-SUPPORTED" : "DERIVED"} />
      </section>
      <ScoreStrip assessment={a} />
      <ObservationPanel candidate={c} chart={false} />
      <TerrainPanel candidate={c} target={target} assessment={a} />
      <GeologyPanel candidate={c} />
      <UtilityPanel assessment={a} />
      <RealityGapPanel assessment={a} />
      <ExperimentPanel assessment={a} />
      <MeasureNext
        candidate={c}
        mission={mission}
        row={frontier(data.candidates, mission).find(
          (r) => r.candidate.id === c.id,
        )}
      />
      {packet ? (
        <>
          <section className="science-section">
            <div className="section-heading">
              <h2>Planetary transfer gap</h2>
              <EvidenceTag kind="ASSUMED" />
            </div>
            <div className="gap-cards">
              {(
                [
                  [
                    "Meaningfully comparable",
                    pkt.transfer_gap.comparable,
                    "ok",
                  ],
                  [
                    "Needs scaling or controlled experiments",
                    pkt.transfer_gap.scaling,
                    "scale",
                  ],
                  [
                    "Needs vacuum, radiation, environmental or reduced-gravity facilities",
                    pkt.transfer_gap.facilities,
                    "facility",
                  ],
                  ["Remains unvalidated", pkt.transfer_gap.unvalidated, "open"],
                ] as const
              ).map(([t, items, k]) => (
                <div key={t} className={`gap-card ${k}`}>
                  <h3>{t}</h3>
                  <ul>
                    {items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
          <section className="science-section packet-repro">
            <div className="section-heading">
              <h2>Reproducibility metadata</h2>
              <EvidenceTag kind="DERIVED" />
            </div>
            <dl>
              <div>
                <dt>Packet generated</dt>
                <dd className="mono">{pkt.generated_at}</dd>
              </div>
              <div>
                <dt>Dataset generated</dt>
                <dd className="mono">
                  {pkt.reproducibility.dataset_generated_at}
                </dd>
              </div>
              <div>
                <dt>Science release · model version</dt>
                <dd className="mono">
                  {pkt.reproducibility.science_release ?? "unavailable"} ·{" "}
                  {pkt.reproducibility.model_version}
                </dd>
              </div>
              <div>
                <dt>Dataset SHA-256</dt>
                <dd className="mono hash-value">
                  {pkt.reproducibility.dataset_sha256 ?? "unavailable"}
                </dd>
              </div>
              <div>
                <dt>Criterion weights</dt>
                <dd className="mono">
                  {Object.entries(pkt.reproducibility.model.weights)
                    .map(([k, v]) => `${k} ${Number(v).toFixed(2)}`)
                    .join(" · ")}
                </dd>
              </div>
              <div>
                <dt>α · γ · minimum coverage</dt>
                <dd className="mono">
                  {pkt.reproducibility.model.alpha} ·{" "}
                  {pkt.reproducibility.model.gamma} ·{" "}
                  {pkt.reproducibility.model.minimum_coverage.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>Similarity tolerances</dt>
                <dd className="mono">
                  {Object.entries(pkt.reproducibility.model.tolerances)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(" · ") || "not applicable (F unavailable)"}
                </dd>
              </div>
              <div>
                <dt>Reproduce</dt>
                <dd className="mono">
                  python scripts/build_discovery.py --offline && python
                  scripts/validate_results.py
                </dd>
              </div>
            </dl>
            <p className="caption">
              JSON, CSV and GeoJSON exports are generated from this same packet
              object; CSV contains only numeric features with units and
              classifications; unknown values are left empty, never zero.
            </p>
          </section>
        </>
      ) : null}
      <section className="science-section passport-sources">
        <h2>Data provenance & references</h2>
        <p>
          NASA climatology acquisition period: 2001–2025. Earth SRTM
          acquisition: February 2000. Raster products and acquisition periods
          are in each target's validated PDS metadata. Dataset generated:{" "}
          {data.generated_at}.
        </p>
        {c.source_refs.map((url, i) => (
          <div key={url}>
            <SourceLink url={url}>
              [{i + 1}] {url}
            </SourceLink>
          </div>
        ))}
        {target.source_refs.map((s) => (
          <div key={s.url}>
            <SourceLink url={s.url}>
              {s.title} · {s.url}
            </SourceLink>
          </div>
        ))}
      </section>
      <section className="passport-link" aria-label="Online version">
        <QrCode
          value={sharedUrl}
          size={160}
          label="QR code linking to this Analog Passport online"
        />
        <div>
          <strong>Live dossier</strong>
          <a className="source-link" href={sharedUrl}>
            Open reproducible model snapshot
          </a>
          <p className="mono">
            {window.location.origin}
            {window.location.pathname}#/{packet ? "expedition" : "passport"}/
            {c.id}?mission={mission}
          </p>
          <p>
            Scan or open the link for the interactive version: Analog DNA, the
            3D terrain viewer, adjustable model weights and source links. The QR
            code preserves the active model, including weights, α, tolerances
            and coverage threshold. The printed copy reflects settings in use at{" "}
            {new Date().toISOString().slice(0, 16).replace("T", " ")} UTC.
          </p>
        </div>
      </section>
      <footer className="passport-disclaimer">
        <strong>Scientific interpretation disclaimer</strong>
        <p>
          This deterministic dossier presents observed, derived,
          literature-supported and explicitly assumed screening information. It
          is not a finding of planetary equivalence, site access authorization,
          field verification, vehicle safety certification or NASA approval. No
          field experiment has been conducted. Confirm geological context and
          obtain required permits before any field activity.
        </p>
      </footer>
    </main>
  );
}
