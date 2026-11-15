import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { number } from "../../lib/data";
import {
  earthAtmosphere,
  gasDensity,
  GRAVITY,
  R_MARS_CO2,
  dynamicPressure,
} from "../../lib/physics";
import {
  dustThreshold,
  earthSolar,
  frictionVelocity10m,
  type DailyExtremes,
  type IlluminationSite,
} from "../../lib/researchLab";
import {
  calculate,
  InputError,
  Metric,
  Numeric,
  Outcome,
  Panel,
  type SiteContext,
} from "./Shared";

const NOAASOURCE = "https://www.gml.noaa.gov/grad/solcalc/solareqns.PDF";
const DUSTSOURCE = "https://doi.org/10.1029/2000JD900304";
export function Thermal({
  candidate,
  mission,
  light,
  lightError,
  extremes,
}: {
  light?: IlluminationSite[];
  lightError?: string;
  extremes?: DailyExtremes;
} & SiteContext) {
  const [day, setDay] = useState<number | null>(172),
    [hour, setHour] = useState<number | null>(12),
    [lunarId, setLunarId] = useState("haworth"),
    [index, setIndex] = useState(0);
  const lunar = light?.find((s) => s.id === lunarId),
    profile = extremes?.profiles.find((p) => p.id === candidate.id);
  const result = calculate(() =>
    day === null || hour === null
      ? null
      : earthSolar(candidate.latitude, day, hour),
  );
  const path =
    calculate(() =>
      day === null
        ? []
        : Array.from({ length: 25 }, (_, h) => ({
            hour: h,
            elevation: earthSolar(candidate.latitude, day, h).elevation,
          })),
    ).value ?? [];
  const current = lunar
    ? {
        sunElevation: lunar.hourly.sun_elevation_deg[index],
        sunAzimuth: lunar.hourly.sun_azimuth_deg[index],
        visible: lunar.hourly.visible[index],
      }
    : null;
  const daily = profile?.status === "available" ? profile.variables : undefined;
  const air = candidate.climate.T2M;
  return (
    <>
      <Panel
        title="Design for the actual observable"
        eyebrow="Temperature and solar geometry"
      >
        <p>
          Earth air temperature, lunar surface thermal models and sunlight
          geometry are separate observations/calculations. They are not an exact
          thermal analogy.
        </p>
        <div className="lab-metrics">
          <Metric
            label="NASA POWER mean2m air temperature"
            value={number(air?.value, 2)}
            unit={air?.unit}
            hint="2001–2025climatology, coarse grid"
          />
          <Metric
            label="2025lowest daily minimum"
            value={number(daily?.T2M_MIN?.min, 2)}
            unit={daily?.T2M_MIN?.unit ?? "unassessed"}
            hint={
              daily
                ? `${daily.T2M_MIN.valid_days} valid days · selected-site POWER grid`
                : "No daily refinement for this site"
            }
          />
          <Metric
            label="2025highest daily maximum"
            value={number(daily?.T2M_MAX?.max, 2)}
            unit={daily?.T2M_MAX?.unit ?? "unassessed"}
            hint="Air temperature; not a rock/surface reading"
          />
        </div>
        {daily && extremes && (
          <>
            <div className="lab-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={extremes.dates.map((date, i) => ({
                    date,
                    min: daily.T2M_MIN.values[i],
                    max: daily.T2M_MAX.values[i],
                  }))}
                >
                  <CartesianGrid stroke="#29384e" />
                  <XAxis
                    dataKey="date"
                    minTickGap={60}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    label={{
                      value: "°C ·2m air",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#97a8bd",
                    }}
                  />
                  <Tooltip />
                  <Line
                    dataKey="min"
                    stroke="#35c3b0"
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="max"
                    stroke="#f17e5a"
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="caption">
              <a href={profile!.source_url} target="_blank" rel="noreferrer">
                Actual2025 POWER daily response
              </a>{" "}
              · All available days retained; a one-year envelope is not a
              long-term extreme or return period.
            </p>
          </>
        )}
      </Panel>
      <div className="lab-two">
        <Panel
          title="Earth solar operating window"
          eyebrow="Calculated teaching approximation"
        >
          <div className="lab-input-grid">
            <Numeric
              label="Day of2025"
              value={day}
              onChange={setDay}
              min={1}
              max={365}
            />
            <Numeric
              label="Earth true solar hour"
              value={hour}
              onChange={setHour}
              min={0}
              max={24}
              step={0.5}
              unit="not civil/UTC time"
            />
          </div>
          <InputError message={result.error} />
          <div className="lab-metrics">
            <Metric
              label="Geometric Sun elevation"
              value={number(result.value?.elevation, 2)}
              unit="degrees"
            />
            <Metric
              label="Sun azimuth"
              value={number(result.value?.azimuth, 2)}
              unit="° clockwise from north"
            />
          </div>
          <div className="lab-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={path}>
                <CartesianGrid stroke="#29384e" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis domain={[-90, 90]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <ReferenceLine y={0} stroke="#97a8bd" />
                <Line
                  dataKey="elevation"
                  stroke="#35c3b0"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="caption">
            <a href={NOAASOURCE} target="_blank" rel="noreferrer">
              NOAA fractional-year approximation
            </a>{" "}
            · Latitude {number(candidate.latitude, 3)}° · no refraction or local
            terrain obstruction. The chart is solar elevation, not received
            energy or temperature.
          </p>
        </Panel>
        <Panel
          title="Lunar sampled-terrain sunlight"
          eyebrow="NASA/JPL SPICE + actual LOLA"
        >
          <label className="lab-input">
            Lunar illumination reference
            <select
              value={lunarId}
              onChange={(e) => setLunarId(e.target.value)}
            >
              {light?.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name} · feature centre
                </option>
              ))}
            </select>
          </label>
          {lightError && <p role="status">{lightError}</p>}
          {!light && !lightError && (
            <p role="status">Validating the pinned lunar geometry…</p>
          )}
          {lunar && (
            <>
              <div className="lab-metrics">
                <Metric
                  label="2025sampled Sun-centre visibility"
                  value={number(100 * lunar.summary.visible_fraction, 2)}
                  unit="% of hourly samples"
                />
                <Metric
                  label="Longest sampled dark run"
                  value={number(lunar.summary.max_sampled_dark_run_hours, 0)}
                  unit="hours"
                  hint={
                    lunar.summary.boundary_darkness_censored
                      ? "Period-boundary darkness may be censored"
                      : "Within the sampled year"
                  }
                />
              </div>
              <div className="lab-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={lunar.monthly.map((m) => ({
                      month: m.month,
                      visible: 100 * m.visible_fraction,
                    }))}
                  >
                    <CartesianGrid stroke="#29384e" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar
                      dataKey="visible"
                      fill="#c6d7e8"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <label className="lab-input">
                Inspect2025 hourly sample
                <input
                  aria-label="Lunar hourly sample"
                  type="range"
                  min={0}
                  max={8759}
                  value={index}
                  onChange={(e) => setIndex(Number(e.target.value))}
                />
                <span className="mono">
                  {new Date(
                    Date.UTC(2025, 0, 1, 0, 30) + index * 3600000,
                  ).toISOString()}{" "}
                  · Sun {number(current?.sunElevation, 3)}° ·{" "}
                  {current?.visible
                    ? "above modeled horizon"
                    : "below modeled horizon"}
                </span>
              </label>
              <p className="scientific-caveat">
                MOON_ME frame;2m observer;4km LOLA sample spacing within24km.
                Interpolated sampled terrain and a0° horizon floor omit
                unresolved/distant terrain, finite solar disk, Earth eclipses
                and hardware. One year cannot establish permanent illumination
                or permanent shadow.
              </p>
            </>
          )}
        </Panel>
      </div>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="illumination"
        question="Which thermal and lighting conditions should the Earth experiment cover?"
        decision="Use the actual one-year Earth air envelope to plan instrument operations, and the separate lunar geometry model to expose lighting/darkness constraints. A matching temperature or annual percentage does not reproduce a lunar surface environment."
        next="Collect calibrated ground/rock/air temperature and irradiance time series at proposed stations. For a lunar engineering decision, use finer terrain, full-cycle illumination, finite-disk/eclipse treatment and an explicit equipment/power thermal model."
        inputs={{
          earthDay: day,
          earthTrueSolarHour: hour,
          lunarReference: lunarId,
          inspectedHour: index,
        }}
        results={{
          earthSolar: result.value,
          lunarSummary: lunar?.summary ?? null,
          lunarSample: current,
          dailyExtremes: daily
            ? {
                T2M_MIN: daily.T2M_MIN.min,
                T2M_MAX: daily.T2M_MAX.max,
                period: extremes?.period,
              }
            : null,
        }}
        sources={[
          NOAASOURCE,
          "https://naif.jpl.nasa.gov/naif/spiceconcept.html",
          ...(profile?.status === "available" ? [profile.source_url] : []),
        ]}
      />
    </>
  );
}

export function Dust({ candidate, mission }: SiteContext) {
  const [wind, setWind] = useState<number | null>(15),
    [diameter, setDiameter] = useState<number | null>(100),
    [particle, setParticle] = useState<number | null>(2650),
    [roughness, setRoughness] = useState<number | null>(0.001),
    [gamma, setGamma] = useState<number | null>(0.0003);
  const earth = earthAtmosphere(candidate),
    earthDensity = "density" in earth ? earth.density : null;
  const result = calculate(() => {
    if ([wind, diameter, particle, roughness, gamma].some((v) => v === null))
      return null;
    const u = frictionVelocity10m(wind!, roughness!);
    return [
      {
        body: "Earth",
        rho: earthDensity,
        g: GRAVITY.earth,
        kind: "Density derived from selected-site POWER meanPS/T2M; wind/grains are scenarios",
      },
      {
        body: "Mars",
        rho: gasDensity(600, 210, R_MARS_CO2),
        g: GRAVITY.mars,
        kind: "Scenario:600Pa,210K,CO2; not Jezero measurements",
      },
      {
        body: "Moon",
        rho: 0,
        g: GRAVITY.moon,
        kind: "Vacuum approximation; no atmospheric wind entrainment",
      },
    ].map((r) => ({
      ...r,
      uStar: r.rho === 0 ? null : u,
      threshold:
        r.rho === null
          ? null
          : dustThreshold(r.rho, particle!, r.g, diameter! * 1e-6, gamma!),
      dynamicPressure: r.rho === null ? null : dynamicPressure(r.rho, wind!),
    }));
  });
  return (
    <>
      <Panel
        title="A wind speed is not a dust-transport measurement"
        eyebrow="Shao–Lu grain-initiation scenario"
      >
        <p>
          Evaluate a dry, bare, loose-grain threshold in friction velocity.
          NASA10m wind and column AOD are not measured surface shear, particle
          composition or dust deposition.
        </p>
        <p className="lab-equation mono">
          u*ₜ = √[0.0123(ρₚgd/ρₐ + γ/(ρₐd))]
          <br />
          u* =0.4 U₁₀ / ln(10/z₀)
        </p>
        <div className="lab-input-grid">
          <Numeric
            label="Scenario10m wind"
            value={wind}
            onChange={setWind}
            min={0}
            max={100}
            unit="m/s"
          />
          <Numeric
            label="Particle diameter"
            value={diameter}
            onChange={setDiameter}
            min={1}
            max={2000}
            unit="micrometres"
          />
          <Numeric
            label="Particle material density"
            value={particle}
            onChange={setParticle}
            min={100}
            max={10000}
            unit="kg/m³"
          />
          <Numeric
            label="Aerodynamic roughness length"
            value={roughness}
            onChange={setRoughness}
            min={0.000001}
            max={1}
            step={0.001}
            unit="m"
          />
          <Numeric
            label="Cohesion parameter gamma"
            value={gamma}
            onChange={setGamma}
            min={0}
            max={0.001}
            step={0.00001}
            unit="kg/s²"
          />
        </div>
        {"windSpeed" in earth && earth.windSpeed !== null && (
          <button
            className="button outline"
            onClick={() => setWind(earth.windSpeed)}
          >
            Use cached POWER mean as scenario input (
            {number(earth.windSpeed, 2)}m/s)
          </button>
        )}
        <InputError message={result.error} />
        {diameter !== null && (diameter < 30 || diameter > 1300) && (
          <p role="alert" className="lab-error">
            Diameter is outside the roughly30–1300µm experimental range
            discussed by the source. This is an extrapolation.
          </p>
        )}
        {result.value && (
          <div className="table-scroll">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Environment</th>
                  <th>Gas density kg/m³</th>
                  <th>Scenario u* m/s</th>
                  <th>Threshold u*ₜ m/s</th>
                  <th>Dynamic pressure Pa</th>
                </tr>
              </thead>
              <tbody>
                {result.value.map((r) => (
                  <tr key={r.body}>
                    <th>
                      {r.body}
                      <small>{r.kind}</small>
                    </th>
                    <td className="mono">{number(r.rho, 5)}</td>
                    <td className="mono">{number(r.uStar, 3)}</td>
                    <td className="mono">{number(r.threshold, 3)}</td>
                    <td className="mono">{number(r.dynamicPressure, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="scientific-caveat">
          Neutral log-law assumptions, empirical grain cohesion and idealized
          grains are declared model choices. Threshold exceedance is not a
          dust-storm prediction: crusts, wetness, aggregation, turbulence,
          impact entrainment and local soil evidence are missing. The formula is
          undefined in vacuum, not zero. The same empirical grain parameters are
          applied to Mars as an unvalidated transfer scenario;
          rarefied-flow/Reynolds corrections are not modeled.
        </p>
        <p className="caption">
          <a href={DUSTSOURCE} target="_blank" rel="noreferrer">
            Shao & Lu(2000), Eq24
          </a>{" "}
          · gamma nominal3×10⁻⁴kg/s²; published empirical range1.65–5×10⁻⁴.
          AOD550 remains column aerosol extinction, not dust-specific
          composition.
        </p>
      </Panel>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="dust"
        question="Which wind–soil measurements would make an erosion experiment meaningful?"
        decision={
          earthDensity === null
            ? "Earth gas density is unassessed because required POWER pressure/temperature evidence is missing; no threshold was invented for this site."
            : "The model quantifies sensitivity to declared grain, cohesion and roughness assumptions. It does not establish that local soil mobilizes at the chosen wind speed."
        }
        next="Measure grain-size distribution, density, moisture/crust/cohesion, roughness and near-surface shear or a wind profile. Collect repeatable erosion/deposition and instrument-contamination measurements with uncertainty; use a controlled facility to test pressure scaling."
        inputs={{
          classification: "SCENARIO",
          wind10m: wind,
          diameterMicrometres: diameter,
          particleDensity: particle,
          roughnessM: roughness,
          gamma,
        }}
        results={result.value}
        sources={[
          DUSTSOURCE,
          ...[
            candidate.climate.PS?.provenance.source_url,
            candidate.climate.T2M?.provenance.source_url,
          ].filter((s): s is string => !!s),
        ]}
      />
    </>
  );
}
