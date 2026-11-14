import { Link, useSearchParams } from "react-router-dom";
import { ShieldCheck, ExternalLink, Moon } from "lucide-react";
import { useData, number } from "../lib/data";
import { useScienceFile } from "../lib/scienceFile";
import {
  lunarPolarSchema,
  polarXY,
  type LunarPolar as Polar,
} from "../lib/lunarPolar";
import ElevationGrid from "../components/ElevationGrid";
import { cellLabel } from "../lib/cellSearch";
import { BackLink } from "../components/ui";

const MISSING =
  "The lunar south-pole module is not part of this historical science release. No newer data were substituted.";
const fColor = (f: number | null) =>
  f === null
    ? "#7b8798"
    : f >= 80
      ? "#3ec9b0"
      : f >= 50
        ? "#f2c14e"
        : f >= 20
          ? "#ff8a65"
          : "#7b8798";
type Site = Polar["sites"][number];

function PolarMap({
  sites,
  selected,
  onSelect,
}: {
  sites: Site[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const R = 190,
    maxColat = 8.5;
  return (
    <svg
      className="polar-map"
      viewBox={`${-R - 30} ${-R - 30} ${2 * R + 60} ${2 * R + 60}`}
      role="group"
      aria-label="South polar map of the sampled feature centres"
    >
      <circle r={R} className="polar-disc" />
      {[2, 4, 6, 8].map((c) => (
        <g key={c}>
          <circle r={(c / maxColat) * R} className="polar-ring" />
          <text x={4} y={-(c / maxColat) * R - 3} className="polar-tick">
            {-90 + c}°
          </text>
        </g>
      ))}
      {[0, 90, 180, 270].map((lon) => {
        const p = polarXY(-90 + maxColat, lon, R, maxColat);
        return (
          <g key={lon}>
            <line x1={0} y1={0} x2={p.x} y2={p.y} className="polar-ring" />
            <text
              x={p.x * 1.08}
              y={p.y * 1.08 + 4}
              textAnchor="middle"
              className="polar-tick"
            >
              {lon === 0
                ? "0°"
                : lon === 180
                  ? "180°"
                  : lon === 90
                    ? "90°E"
                    : "90°W"}
            </text>
          </g>
        );
      })}
      <text x={0} y={4} textAnchor="middle" className="polar-pole">
        ✕ pole
      </text>
      {sites.map((s, i) => {
        const p = polarXY(s.latitude, s.longitude, R, maxColat),
          rr = Math.max(5, (s.diameter_km / 2 / 30.3 / maxColat) * R),
          best = s.earth_twins?.[0]?.F ?? null,
          sel = s.id === selected;
        return (
          <g
            key={s.id}
            transform={`translate(${p.x},${p.y})`}
            className={`polar-site ${sel ? "sel" : ""}`}
            tabIndex={0}
            role="button"
            aria-pressed={sel}
            aria-label={`${s.feature}: best Earth terrain twin F ${number(best, 1)}`}
            onClick={() => onSelect(s.id)}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && onSelect(s.id)
            }
          >
            <circle
              r={rr}
              fill={fColor(best)}
              fillOpacity={0.22}
              stroke={fColor(best)}
              strokeWidth={sel ? 3 : 1.5}
              strokeDasharray={s.artemis_region ? undefined : "3 3"}
            />
            <circle r={9} className="polar-badge" stroke={fColor(best)} />
            <text y={3.5} textAnchor="middle" className="polar-num">
              {i + 1}
            </text>
            {sel && (
              <text y={-rr - 6} textAnchor="middle" className="polar-label">
                {s.feature}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function LunarPolar() {
  const data = useData();
  const { value: polar, error } = useScienceFile(
    "lunar_polar.json",
    lunarPolarSchema,
    MISSING,
  );
  const [params, setParams] = useSearchParams();
  const selected = params.get("site") ?? "mons-mouton";
  const setSelected = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("site", id);
    setParams(next, { replace: true });
  };
  if (error)
    return (
      <main className="document-page">
        <BackLink mission="mare-crisium" />
        <p role="alert">{error}</p>
      </main>
    );
  if (!polar)
    return (
      <main className="document-page">
        <p>Loading the lunar south-pole module…</p>
      </main>
    );
  const sites = polar.sites.filter((s) => s.status === "available");
  if (!sites.length)
    return (
      <main className="document-page">
        <h1>No validated polar terrain profiles are available</h1>
        <p role="status">
          Source-derived metrics remain unavailable. No replacement terrain was
          generated.
        </p>
      </main>
    );
  const site = sites.find((s) => s.id === selected) ?? sites[0];
  const ranked = sites
    .filter((s) => s.earth_twins?.length)
    .sort(
      (a, b) => (b.earth_twins?.[0]?.F ?? 0) - (a.earth_twins?.[0]?.F ?? 0),
    );
  const m = site.terrain!.metrics;
  const name = (id: string, fallback: string) => {
    const known = data.candidates.find((c) => c.id === id)?.name;
    if (known) return known;
    const m = /^([a-z]+)-(-?\d+\.\d+)-(-?\d+\.\d+)$/.exec(id),
      region = data.regions.find((r) => r.id === m?.[1])?.name;
    return m && region
      ? `${region} · ${cellLabel({ latitude: +m[2], longitude: +m[3] })}`
      : fallback;
  };

  return (
    <main className="document-page polar-page">
      <BackLink mission="mare-crisium" />
      <header className="document-title">
        <div>
          <p className="document-label">Investigate · Lunar south pole</p>
          <h1>Where Earth runs out of terrain analogs.</h1>
          <p>
            NASA's October 2024 announcement listed nine candidate Artemis III
            regions near the lunar south pole (historical context, not a current
            landing commitment). TerrainX samples NASA LOLA elevations at the
            official IAU centres of the features those regions are named after,
            then searches all {polar.earth_profiles_compared} Earth terrain
            profiles for the closest relief.
          </p>
        </div>
        <div className="polar-verify">
          <ShieldCheck size={20} />
          <div>
            <strong>LOLA LDEM_16 verified</strong>
            <span className="mono">
              SHA-256 {polar.raster.sha256.slice(0, 12)}…
              {polar.raster.sha256.slice(-4)}
            </span>
            <span>
              {(polar.raster.bytes / 1e6).toFixed(1)} MB · matches the checksum
              pinned in the repo
            </span>
            {polar.diviner && (
              <>
                <strong className="polar-verify-2">
                  Diviner PRP south ·{" "}
                  {polar.diviner.verification
                    ? "PDS MD5 verified"
                    : "retrieval hash recorded"}
                </strong>
                <span className="mono">
                  SHA-256 {polar.diviner.sha256.slice(0, 12)}…
                  {polar.diviner.sha256.slice(-4)}
                </span>
                <span>
                  {(polar.diviner.bytes / 1e6).toFixed(0)} MB streamed ·{" "}
                  {polar.diviner.records_scanned.toLocaleString()} triangles
                  scanned
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="polar-workbench">
        <div className="polar-map-wrap">
          <PolarMap sites={sites} selected={site.id} onSelect={setSelected} />
          <ol className="polar-key">
            {sites.map((s, i) => (
              <li key={s.id}>
                <button
                  className={`link-button ${s.id === site.id ? "sel" : ""}`}
                  onClick={() => setSelected(s.id)}
                >
                  <b>{i + 1}</b> {s.feature}
                </button>
              </li>
            ))}
          </ol>
          <p className="caption">
            Azimuthal view of the south pole (0° up, east clockwise); circles
            show IAU feature diameters, colour the best Earth terrain-twin F.
            Dashed: Shackleton, a reference outside the nine regions.
          </p>
        </div>
        <aside className="polar-detail" aria-live="polite">
          <p className="document-label">
            <Moon size={12} />{" "}
            {site.artemis_region
              ? `Artemis III region: ${site.artemis_region}`
              : "Reference feature (not an Artemis III region)"}
          </p>
          <h2>{site.feature}</h2>
          <p className="caption mono">
            IAU {site.iau_id} · {site.latitude.toFixed(2)}°,{" "}
            {site.longitude.toFixed(2)}° · ⌀ {site.diameter_km} km ·{" "}
            <a href={site.gazetteer_url} target="_blank" rel="noreferrer">
              Gazetteer <ExternalLink size={11} />
            </a>
          </p>
          <div className="polar-pair">
            <ElevationGrid
              z={site.terrain!.elevations_m}
              tint="moon"
              label={`${site.feature} LOLA`}
              size={132}
            />
            <dl className="cell-scores">
              <div>
                <dt>Median slope</dt>
                <dd className="mono">{number(m.median_slope_deg, 1)}°</dd>
              </div>
              <div>
                <dt>p90 slope</dt>
                <dd className="mono">{number(m.p90_slope_deg, 1)}°</dd>
              </div>
              <div>
                <dt>Relief</dt>
                <dd className="mono">{number(m.relief_m, 0)} m</dd>
              </div>
              <div>
                <dt>RMS roughness</dt>
                <dd className="mono">{number(m.detrended_rms_m, 0)} m</dd>
              </div>
            </dl>
          </div>
          {site.diviner && polar.diviner && (
            <div className="polar-diviner">
              <h3>Diviner modeled temperature and ice stability</h3>
              <dl className="cell-scores">
                <div>
                  <dt>Annual max T (median)</dt>
                  <dd className="mono">
                    {number(site.diviner.temp_max_k?.median, 0)} K
                  </dd>
                </div>
                <div>
                  <dt>Coldest annual max</dt>
                  <dd className="mono">
                    {number(site.diviner.temp_max_k?.min, 0)} K
                  </dd>
                </div>
                <div>
                  <dt>
                    Modeled cold area &lt; {polar.diviner.cold_trap_threshold_k}{" "}
                    K
                  </dt>
                  <dd className="mono">
                    {number(
                      site.diviner.cold_trap_fraction == null
                        ? null
                        : site.diviner.cold_trap_fraction * 100,
                      0,
                    )}
                    %
                  </dd>
                </div>
                <div>
                  <dt>Modeled ice stability ≤1m</dt>
                  <dd className="mono">
                    {Math.round(
                      site.diviner.ice_stable_within_1m_fraction * 100,
                    )}
                    %
                  </dd>
                </div>
              </dl>
              <p className="caption">
                {site.diviner.triangles.toLocaleString()} Diviner triangles
                within {polar.diviner.radius_km} km · ice stable at the surface
                on {Math.round(site.diviner.ice_surface_stable_fraction * 100)}%
                {site.diviner.median_ice_depth_m != null
                  ? `, median stability depth ${site.diviner.median_ice_depth_m.toFixed(2)} m where stable`
                  : ""}
                .
                {polar.earth_coldest_cell && (
                  <>
                    {" "}
                    The coldest monthly mean daily minimum air temperature in
                    this130-cell sample is{" "}
                    {polar.earth_coldest_cell.kelvin.toFixed(0)} K. POWER air
                    climatology and Diviner lunar surface thermal models are
                    different observables; this does not bound all Earth
                    temperatures.
                  </>
                )}
              </p>
              <p className="caption">
                Model-derived thermal/stability estimates, not a detection of
                water ice.{" "}
                {site.diviner.fraction_basis ??
                  "Legacy fractions count triangles."}{" "}
                Unknown ice-code area:{" "}
                {number(
                  site.diviner.ice_undocumented_code_fraction == null
                    ? null
                    : 100 * site.diviner.ice_undocumented_code_fraction,
                  2,
                )}
                %. Missing thermal area:{" "}
                {number(
                  site.diviner.thermal_valid_area_fraction == null
                    ? null
                    : 100 * (1 - site.diviner.thermal_valid_area_fraction),
                  2,
                )}
                %.
              </p>
              {polar.diviner.verification && (
                <a
                  href={polar.diviner.verification.published_manifest_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Published PDS MD5 manifest · {polar.diviner.verification.md5}
                </a>
              )}
            </div>
          )}
          <h3>Closest Earth relief</h3>
          <ol className="polar-twins">
            {(site.earth_twins ?? []).slice(0, 4).map((t) => (
              <li key={t.id}>
                <span>
                  <strong>{name(t.id, t.name)}</strong>
                  <small>
                    {t.kind} · {t.region_id}
                  </small>
                </span>
                <i
                  style={{
                    ["--f" as string]: `${t.F}%`,
                    ["--c" as string]: fColor(t.F),
                  }}
                  aria-hidden="true"
                />
                <b className="mono">F {t.F.toFixed(1)}</b>
              </li>
            ))}
          </ol>
          <p className="caption">
            Relief shape only. A crater floor, rim or massif footprint is
            sampled at 4 km over 24 km — not a landing site.
          </p>
        </aside>
      </section>

      <section className="science-section">
        <h2>Earth twin strength by feature</h2>
        <div className="polar-bars" role="list">
          {ranked.map((s) => {
            const f = s.earth_twins?.[0]?.F ?? 0;
            return (
              <button
                key={s.id}
                role="listitem"
                className={`polar-bar ${s.id === site.id ? "sel" : ""}`}
                onClick={() => setSelected(s.id)}
              >
                <span>{s.feature}</span>
                <i
                  style={{
                    ["--f" as string]: `${f}%`,
                    ["--c" as string]: fColor(f),
                  }}
                />
                <b className="mono">{f.toFixed(1)}</b>
                <small className="mono">
                  relief {number(s.terrain!.metrics.relief_m, 0)} m · p90{" "}
                  {number(s.terrain!.metrics.p90_slope_deg, 1)}°
                  {s.diviner
                    ? ` · cold trap ${number(s.diviner.cold_trap_fraction == null ? null : s.diviner.cold_trap_fraction * 100, 0)}%`
                    : ""}
                </small>
              </button>
            );
          })}
        </div>
        <p>
          Strongest Earth twins:{" "}
          {ranked
            .slice(0, 2)
            .map((s) => `${s.feature} (F ${s.earth_twins![0].F.toFixed(0)})`)
            .join(" and ")}
          . Weakest:{" "}
          {ranked
            .slice(-3)
            .map((s) => `${s.feature} (F ${s.earth_twins![0].F.toFixed(0)})`)
            .join(", ")}{" "}
          — steep massifs and deep polar craters with no close relief anywhere
          in TerrainX's four study regions. That gap is itself a finding:
          rehearsing operations for those slopes needs Earth sites outside
          today's search.
        </p>
      </section>

      <section className="science-section lens-rules">
        <h2>What no Earth site reproduces here</h2>
        <ol>
          {polar.caveats.map((c) => (
            <li key={c}>{c}</li>
          ))}
          {polar.diviner && (
            <li>
              Cold-trap threshold from {polar.diviner.cold_trap_reference}.{" "}
              {polar.diviner.notes}
            </li>
          )}
          <li>
            Earth terrain twins are relief comparisons only; none of these Earth
            sites is a cold-trap or volatile analog.
          </li>
        </ol>
        <p className="caption">
          Sources:{" "}
          {polar.sources.map((s, i) => (
            <span key={s.url}>
              {i ? " · " : ""}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
            </span>
          ))}
        </p>
        <p>
          <Link to="/cells?mission=mare-crisium">
            See the 130-cell search for Mare Crisium
          </Link>
        </p>
      </section>
    </main>
  );
}
