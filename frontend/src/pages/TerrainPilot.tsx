import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useData, number } from "../lib/data";
import {
  currentRelease,
  fetchScienceJson,
  scienceAssetUrl,
} from "../lib/release";
import { pilotSchema, pilotRange, type Pilot } from "../lib/pilot";
import { EvidenceTag, SourceLink } from "../components/ui";
function Grid({
  values,
  label,
}: {
  values: (number | null)[][];
  label: string;
}) {
  const sorted = values
      .flat()
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b),
    median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
    max = Math.max(1, ...sorted.map((z) => Math.abs(z - median)));
  return (
    <figure className="pilot-grid">
      <figcaption>
        {label}
        <small>7 × 7 observed-source box means · 4 km spacing</small>
      </figcaption>
      <svg
        viewBox="0 0 280 280"
        role="img"
        aria-label={`${label}: actual aggregated terrain, relative to its own median`}
      >
        {values.flatMap((row, y) =>
          row.map((value, x) => (
            <g key={`${x}-${y}`}>
              <rect
                x={x * 40 + 1}
                y={y * 40 + 1}
                width="38"
                height="38"
                fill={
                  value === null
                    ? "#29384e"
                    : `hsl(${190 - ((value - median) / max) * 125} 38% ${35 + ((value - median) / max) * 8}%)`
                }
              />
              <text
                x={x * 40 + 20}
                y={y * 40 + 24}
                textAnchor="middle"
                fill="#fff"
                fontSize="9"
              >
                {value === null ? "—" : Math.round(value - median)}
              </text>
            </g>
          )),
        )}
      </svg>
      <p>
        m relative to this grid’s median; colors are illustrative. Separate
        vertical reference surfaces, no comparison of absolute heights.
      </p>
    </figure>
  );
}
export default function TerrainPilot() {
  const [params,setParams]=useSearchParams();
  const filename=params.get("study")==="expanded"?"terrain_support.json":"terrain_pilot.json";
  const data = useData(),
    [pilot, setPilot] = useState<Pilot | null>(null),
    [error, setError] = useState(""),
    [site, setSite] = useState(params.get("id")??"saudi-24.000-39.375"),
    [mission, setMission] = useState(params.get("mission")??"jezero"),
    [support, setSupport] = useState(8000),
    [offset, setOffset] = useState("center");
  useEffect(() => {
    let live = true;
    setPilot(null);
    setError("");
    if (!currentRelease()?.files[filename]) {
      setError(
        "The common-support pilot was not included in this historical science release.",
      );
      return;
    }
    fetchScienceJson(filename)
      .then((x) => {
        const parsed = pilotSchema.parse(x);
        if (live){setPilot(parsed);if(!parsed.results.some(r=>r.candidate_id===site))setSite(parsed.results[0].candidate_id);}
      })
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [data.release?.release_id,filename]);
  const result = pilot?.results.find(
      (r) => r.candidate_id === site && r.mission === mission,
    ),
    scenario = result?.scenarios.find(
      (s) => s.support_m === support && s.offset === offset,
    ),
    range = result ? pilotRange(result.scenarios) : null;
  const fields = [
    ["median_slope_deg", "Median slope", "°"],
    ["p90_slope_deg", "90th-percentile slope", "°"],
    ["relief_m", "Q95−Q05 relief", "m"],
    ["detrended_rms_m", "Detrended RMS roughness", "m"],
  ] as const;
  return (
    <main className="document-page pilot-page">
      <header className="document-title">
        <div>
          <p className="document-label">
            Experimental / spatial support sensitivity
          </p>
          <h1>Same window. Different worlds.</h1>
          <p>
            A {filename==="terrain_support.json"?"18-site":"two-site"} experiment asks how terrain comparison changes when real
            Earth and planetary elevations are averaged over the same physical
            area.
          </p>
        </div>
        <EvidenceTag kind="DERIVED" />
      </header>
      <p className="scientific-caveat">
        This is a separate processing experiment. Discovery, utility, coverage
        and existing SRTM fidelity scores remain unchanged. Common aggregation
        support improves comparability; it does not establish calibrated
        physical equivalence.
      </p>
      <label className="research-form">Support study <select aria-label="Support study" value={filename==="terrain_support.json"?"expanded":"original"} onChange={e=>{const p=new URLSearchParams(params);p.set("study",e.target.value);setParams(p);}}><option value="original">Original two-site pilot</option><option value="expanded">Expanded 18-site support study</option></select></label>
      {error && <p role="status">{error}</p>}
      {pilot && result && scenario && (
        <>
          <div className="research-form pilot-controls">
            <label>
              Earth site
              <select value={site} onChange={(e) => setSite(e.target.value)}>
                <option value="saudi-24.000-39.375">
                  Western Saudi Arabia · automatic candidate
                </option>
                <option value="reference-salda">
                  Lake Salda shoreline · reference benchmark
                </option>
              </select>
            </label>
            <label>
              Planetary reference
              <select
                value={mission}
                onChange={(e) => setMission(e.target.value)}
              >
                <option value="jezero">Mars / Jezero Crater</option>
                <option value="mare-crisium">Moon / Mare Crisium</option>
              </select>
            </label>
            <label>
              Common square averaging support
              <select
                value={support}
                onChange={(e) => setSupport(Number(e.target.value))}
              >
                <option value={8000}>8 × 8 km</option>
                <option value={12000}>12 × 12 km</option>
              </select>
            </label>
            <label>
              Coupled window offset on both worlds
              <select
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
              >
                {["center", "east", "west", "north", "south"].map((o) => (
                  <option key={o} value={o}>
                    {o === "center" ? "Original center" : `${o} · 4 km`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <section className="science-section">
            <h2>How much does the processing matter?</h2>
            {pilot.sensitivity?.find(r=>r.candidate_id===site&&r.mission===mission)&&(()=>{const r=pilot.sensitivity!.find(r=>r.candidate_id===site&&r.mission===mission)!;return <p className="support-ranks">F-only order: best {r.best_rank??"unassessed"}, median {number(r.median_rank,1)}, worst {r.worst_rank??"unassessed"} across {r.valid_scenarios} valid choices. {r.rank_scope} Scores and ranks describe this selected sample only.</p>;})()}
            <div className="pilot-values">
              {[
                ["Original NASA SRTM F", result.original_srtm_fidelity],
                [
                  "Copernicus point-sampled F",
                  result.partner_point_baseline.value,
                ],
                ["Common-support pilot F", scenario.fidelity.value],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong className="mono">
                    {number(value as number | null, 1)}
                  </strong>
                  <small>Exploratory model points / 100</small>
                </div>
              ))}
            </div>
            <p>
              The point baseline changes the Earth elevation source. Comparing
              that baseline with its box-averaged result separates source
              substitution from aggregation. None is a probability of a
              successful analogy.
            </p>
            <p className="mono">
              {support / 1000} km averaging width · 24 km center footprint ·{" "}
              {scenario.earth.contributing_width_m / 1000} km contributing width
              · 8 km slope baseline
            </p>
          </section>
          <section className="science-section">
            <h2>Inspect the actual averaged grids</h2>
            <div className="pilot-grids">
              <Grid
                values={scenario.earth.elevations_m}
                label="Earth / Copernicus GLO90 DSM"
              />
              <Grid
                values={scenario.planet.elevations_m}
                label={`${result.target} / NASA ${mission === "jezero" ? "MOLA" : "LOLA"}`}
              />
            </div>
            <div className="table-scroll">
              <table className="science-table">
                <thead>
                  <tr>
                    <th>Derived feature</th>
                    <th>Earth</th>
                    <th>{result.target}</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map(([key, label, unit]) => (
                    <tr key={key}>
                      <td>{label}</td>
                      <td>{number(scenario.earth.metrics?.[key], 3)}</td>
                      <td>{number(scenario.planet.metrics?.[key], 3)}</td>
                      <td>{unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Minimum available area per box: Earth{" "}
              {number(scenario.earth.minimum_coverage * 100, 1)}%, target{" "}
              {number(scenario.planet.minimum_coverage * 100, 1)}%. This
              measures valid source pixels, not independent instrument coverage.
            </p>
            <p>
              Native Earth spacing is 3 arcsec (about 90 m); target north–south
              pixel size is{" "}
              {number(result.planet_native_resolution_m / 1000, 3)} km. The 1 km
              calculation lattice adds no planetary observations.
            </p>
          </section>
          <div className="research-grid">
            <section className="research-card">
              <h2>Processing sensitivity</h2>
              <p>
                Across 10 declared support/offset combinations, pilot F ranges
                from{" "}
                <b>
                  {number(range?.min, 1)} to {number(range?.max, 1)}
                </b>
                . Both site and target move in the chosen direction; this tests
                coupled window placement, not all independent offsets.
              </p>
              <div className="pilot-scenarios">
                {result.scenarios.map((s) => (
                  <button
                    className={s === scenario ? "active" : ""}
                    key={`${s.support_m}-${s.offset}`}
                    onClick={() => {
                      setSupport(s.support_m);
                      setOffset(s.offset);
                    }}
                  >
                    <span>
                      {s.support_m / 1000} km · {s.offset}
                    </span>
                    <b>{number(s.fidelity.value, 1)}</b>
                  </button>
                ))}
              </div>
              {scenario.quadrature_check && (
                <p>
                  Center-window numerical check: halving the working lattice to
                  500 m changes F by{" "}
                  {number(scenario.quadrature_check.absolute_score_delta, 4)}{" "}
                  points. This is numerical convergence, not measurement
                  uncertainty.
                </p>
              )}
            </section>
            <section className="research-card">
              <h2>Water, edits and infill</h2>
              {scenario.earth_quality_fractions ? (
                <>
                  <p>
                    Mean area fractions across overlapping Earth boxes (not a
                    unique-area survey):
                  </p>
                  <ul>
                    {Object.entries(scenario.earth_quality_fractions).map(
                      ([key, value]) => (
                        <li key={key}>
                          {key.replaceAll("_", " ")}: {number(value * 100, 2)}%
                        </li>
                      ),
                    )}
                  </ul>
                </>
              ) : (
                <p>
                  Quality fractions are reported for the original-center
                  windows. Choose “Original center” to inspect them.
                </p>
              )}
              <p>
                Water pixels represent an edited surface elevation, not the lake
                floor. Filled pixels may include SRTM and other sources, so
                Copernicus is not wholly independent of the original elevation
                product.
              </p>
            </section>
          </div>
          <section className="science-section">
            <h2>Reproduce and challenge this result</h2>
            <p>
              GDAL area-weighted reprojection to body-specific local
              azimuthal-equidistant grids, followed by coverage-weighted square
              means. Boxes require at least 90% valid area; native planetary
              spacing must be less than half the averaging width. The four
              illustrative tolerances remain 3°, 5°, 150 m and 75 m. They are
              application assumptions.
            </p>
            <ul>
              {pilot.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div className="source-row">
              <a
                className="button outline"
                href={scienceAssetUrl(filename)}
                download
              >
                Download pilot data and provenance
              </a>
              <Link
                className="button outline"
                to={`/site/${site}?mission=${mission}`}
              >
                Original candidate dossier
              </Link>
            </div>
            <div className="reference-list">
              <SourceLink url={pilot.source_manifest.official_collection_url}>
                Copernicus specifications and licence
              </SourceLink>
              <SourceLink url={pilot.source_manifest.doi}>
                Copernicus DEM DOI
              </SourceLink>
              <SourceLink url={result.planet_source.url}>
                NASA PDS binary source
              </SourceLink>
            </div>
            <details>
              <summary>Source checksums and per-tile metadata</summary>
              <div className="pilot-source-list">
                {result.earth_sources.map((s) => (
                  <p key={s.url}>
                    <SourceLink url={s.url}>
                      {s.kind} · {s.relative_path}
                    </SourceLink>
                    <small className="mono">SHA256 {s.sha256}</small>
                  </p>
                ))}
              </div>
            </details>
            <p className="release-note">
              Produced using Copernicus WorldDEM-90 © DLR e.V. 2010-2014 and ©
              Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS
              by the European Union and ESA; all rights reserved.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
