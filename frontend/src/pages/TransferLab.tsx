import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Atom, Gauge, Mountain, TriangleAlert, Wind } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useData, number } from "../lib/data";
import {
  BODY_NAME,
  GRAVITY,
  MARS_SCENARIO,
  MOON_APPROXIMATION,
  dynamicPressure,
  earthAtmosphere,
  equalDynamicPressureSpeed,
  froude,
  froudeMatchedSpeed,
  slopeForces,
  transferGap,
} from "../lib/physics";
import type { Body } from "../lib/physics";
import { BackLink, EvidenceTag } from "../components/ui";
import { MarsGlyph, MoonGlyph } from "../components/glyphs";

const BODIES: Body[] = ["earth", "mars", "moon"];

function Slider({
  id,
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="lab-slider" htmlFor={id}>
      <span>
        {label}
        <b className="mono">
          {value} {unit}
        </b>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function BarRow({
  body,
  value,
  max,
  text,
}: {
  body: Body;
  value: number;
  max: number;
  text: string;
}) {
  return (
    <div className={`lab-bar ${body}`}>
      <span>{BODY_NAME[body]}</span>
      <i>
        <em style={{ width: `${max > 0 ? (100 * value) / max : 0}%` }} />
      </i>
      <b className="mono">{text}</b>
    </div>
  );
}

export default function TransferLab() {
  const data = useData(),
    [params, setParams] = useSearchParams();
  const target: "mars" | "moon" =
    params.get("target") === "moon" ? "moon" : "mars";
  const siteId = params.get("id") ?? data.candidates[0].id;
  const site =
    data.candidates.find((c) => c.id === siteId) ?? data.candidates[0];
  const [speed, setSpeed] = useState(0.5),
    [length, setLength] = useState(0.5),
    [slope, setSlope] = useState(15),
    [mass, setMass] = useState(200),
    [wind, setWind] = useState(10);
  const set = (patch: Record<string, string>) =>
    setParams({ target, id: site.id, ...patch });

  const fr = froude(speed, GRAVITY.earth, length);
  const matched = Object.fromEntries(
    BODIES.map((b) => [b, froudeMatchedSpeed(speed, GRAVITY[b])]),
  ) as Record<Body, number>;
  const forces = Object.fromEntries(
    BODIES.map((b) => [b, slopeForces(mass, GRAVITY[b], slope)]),
  ) as Record<Body, ReturnType<typeof slopeForces>>;
  const earth = earthAtmosphere(site);
  const earthOk = "density" in earth;
  const rhoE = earthOk ? earth.density! : null,
    rhoM = MARS_SCENARIO.density!;
  const q = {
    earth: rhoE != null ? dynamicPressure(rhoE, wind) : null,
    mars: dynamicPressure(rhoM, wind),
    moon: dynamicPressure(0, wind),
  };
  const equalQ =
    rhoE != null ? equalDynamicPressureSpeed(wind, rhoE, rhoM) : null;
  const series = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const v = i + 1;
        return {
          v,
          earth: rhoE != null ? dynamicPressure(rhoE, v) : null,
          mars: dynamicPressure(rhoM, v),
        };
      }),
    [rhoE, rhoM],
  );
  const gap = transferGap(target, rhoE);
  const sorted = [...data.candidates].sort(
    (a, b) =>
      Number(a.benchmark) - Number(b.benchmark) || a.name.localeCompare(b.name),
  );
  return (
    <main className="document-page transfer-page">
      <BackLink mission={target === "moon" ? "mare-crisium" : "jezero"} />
      <header className="document-title">
        <div>
          <p className="document-label">
            <Atom size={14} /> Physics explainer · dimensionless scaling
          </p>
          <h1>Planetary Transfer Lab</h1>
          <p className="frontier-sub">
            An Earth experiment is useful, but Earth is not Mars.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Target body">
          <button
            className={target === "mars" ? "active" : ""}
            aria-pressed={target === "mars"}
            onClick={() => set({ target: "mars" })}
          >
            <MarsGlyph size={15} /> Mars
          </button>
          <button
            className={target === "moon" ? "active" : ""}
            aria-pressed={target === "moon"}
            onClick={() => set({ target: "moon" })}
          >
            <MoonGlyph size={15} /> Moon
          </button>
        </div>
      </header>

      <div className="world-strip">
        {BODIES.map((b) => (
          <div
            key={b}
            className={`world-card ${b} ${b === target ? "target" : ""}`}
          >
            <span>{BODY_NAME[b]}</span>
            <strong className="mono">
              {GRAVITY[b]} <small>m/s²</small>
            </strong>
            <em className="mono">
              g / g⊕ = {(GRAVITY[b] / GRAVITY.earth).toFixed(3)}
            </em>
          </div>
        ))}
      </div>

      {/* MODULE A */}
      <section className="science-section lab-module">
        <div className="section-heading">
          <h2>
            <Gauge size={20} /> A · Gravity and dynamic scaling
          </h2>
          <EvidenceTag kind="DERIVED" />
        </div>
        <div className="lab-grid">
          <div className="lab-controls">
            <Slider
              id="lab-v"
              label="Earth test speed v"
              unit="m/s"
              min={0.05}
              max={3}
              step={0.05}
              value={speed}
              onChange={setSpeed}
            />
            <Slider
              id="lab-L"
              label="Characteristic length L"
              unit="m"
              min={0.1}
              max={3}
              step={0.05}
              value={length}
              onChange={setLength}
            />
            <Slider
              id="lab-slope"
              label="Slope angle θ"
              unit="°"
              min={0}
              max={35}
              step={1}
              value={slope}
              onChange={setSlope}
            />
            <Slider
              id="lab-m"
              label="Hypothetical rover mass m"
              unit="kg"
              min={10}
              max={1000}
              step={10}
              value={mass}
              onChange={setMass}
            />
            <div className="equation-card">
              <code>Fr = v² / (g·L)</code>
              <code>v_target = v_earth · √(g_target / g_earth)</code>
              <code>F∥ = m·g·sin θ · N = m·g·cos θ</code>
              <small>
                L is a declared characteristic length (for example a wheel
                diameter). The rover mass is hypothetical.
              </small>
            </div>
          </div>
          <div className="lab-outputs">
            <div className="lab-kpis">
              <div>
                <dt>Earth Froude number</dt>
                <dd className="mono">{fr.toFixed(4)}</dd>
              </div>
              <div>
                <dt>{BODY_NAME[target]} Froude-matched speed</dt>
                <dd className="mono">
                  {matched[target].toFixed(3)} <small>m/s</small>
                </dd>
              </div>
              <div>
                <dt>Gravity ratio g/g⊕</dt>
                <dd className="mono">
                  {(GRAVITY[target] / GRAVITY.earth).toFixed(3)}
                </dd>
              </div>
            </div>
            <h3>Speed with the same Froude number (same L)</h3>
            {BODIES.map((b) => (
              <BarRow
                key={b}
                body={b}
                value={matched[b]}
                max={matched.earth}
                text={`${matched[b].toFixed(3)} m/s`}
              />
            ))}
            <h3>Gravitational component along the slope F∥ at θ = {slope}°</h3>
            {BODIES.map((b) => (
              <BarRow
                key={b}
                body={b}
                value={forces[b].parallelN}
                max={forces.earth.weightN}
                text={`${forces[b].parallelN.toFixed(1)} N`}
              />
            ))}
            <h3>Normal gravitational load N</h3>
            {BODIES.map((b) => (
              <BarRow
                key={b}
                body={b}
                value={forces[b].normalN}
                max={forces.earth.weightN}
                text={`${forces[b].normalN.toFixed(1)} N`}
              />
            ))}
          </div>
        </div>
        <div className="limitation-banner" role="note">
          <TriangleAlert size={18} />
          <div>
            <strong>Froude matching is not full physical similarity.</strong>
            <p>
              It is one dimensionless dynamic-similarity condition. For a
              wheeled rover, motion is often dominated by wheel–soil interaction
              and quasi-static mechanics, so matching Fr does not predict
              traction, sinkage, slip, wheel failure, rover safety or planetary
              operational speed limits. F∥ and N are simple gravitational
              components of a mass on a slope, not a terramechanics model.
            </p>
          </div>
        </div>
      </section>

      {/* MODULE B */}
      <section className="science-section lab-module">
        <div className="section-heading">
          <h2>
            <Wind size={20} /> B · Atmospheric dynamic pressure
          </h2>
          <EvidenceTag kind="DERIVED" />
        </div>
        <div className="lab-grid">
          <div className="lab-controls">
            <label className="lab-select" htmlFor="lab-site">
              Earth site (NASA POWER PS, T2M, WS10M)
              <select
                id="lab-site"
                value={site.id}
                onChange={(e) => set({ id: e.target.value })}
              >
                {sorted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.benchmark ? "Benchmark · " : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Slider
              id="lab-wind"
              label="Wind speed v"
              unit="m/s"
              min={0}
              max={30}
              step={0.5}
              value={wind}
              onChange={setWind}
            />
            <div className="equation-card">
              <code>ρ = p / (R_specific · T)</code>
              <code>q = ½ · ρ · v²</code>
              <small>p in Pa, T in K, ρ in kg/m³, v in m/s, q in Pa.</small>
            </div>
          </div>
          <div className="lab-outputs">
            <div className="table-scroll">
              <table className="lab-table">
                <thead>
                  <tr>
                    <th>Body</th>
                    <th>Source</th>
                    <th>p (Pa)</th>
                    <th>T (K)</th>
                    <th>R (J/kg·K)</th>
                    <th>ρ (kg/m³)</th>
                    <th>q at {wind} m/s</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Earth</th>
                    <td>
                      <EvidenceTag
                        kind={earthOk ? "MEASURED" : "UNAVAILABLE"}
                      />
                    </td>
                    <td>{earthOk ? number(earth.pressurePa, 0) : "—"}</td>
                    <td>{earthOk ? number(earth.temperatureK, 2) : "—"}</td>
                    <td>{earthOk ? "287.05 (dry air)" : "—"}</td>
                    <td>{earthOk ? number(earth.density, 4) : "—"}</td>
                    <td>
                      {q.earth != null
                        ? `${number(q.earth, 2)} Pa`
                        : "not computed"}
                    </td>
                  </tr>
                  <tr>
                    <th>Mars</th>
                    <td>
                      <EvidenceTag kind="ASSUMED" />
                    </td>
                    <td>600</td>
                    <td>210</td>
                    <td>188.9 (CO₂)</td>
                    <td>{number(rhoM, 5)}</td>
                    <td>{number(q.mars, 3)} Pa</td>
                  </tr>
                  <tr>
                    <th>Moon</th>
                    <td>
                      <EvidenceTag kind="ASSUMED" />
                    </td>
                    <td>≈ 0</td>
                    <td>—</td>
                    <td>—</td>
                    <td>≈ 0</td>
                    <td>≈ 0 Pa</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {earthOk ? (
              <p className="lab-note">
                {earth.notes.join(" · ")} Measured mean 10 m wind at this site:{" "}
                <strong className="mono">
                  {number(earth.windSpeed, 2)} m/s
                </strong>
                .
              </p>
            ) : (
              <p className="lab-note warning-inline">
                <TriangleAlert size={14} />{" "}
                {(earth as { reason: string }).reason}
              </p>
            )}
            <p className="lab-callout">
              A {wind} m/s wind gives{" "}
              <strong>
                {q.earth != null ? `${number(q.earth, 1)} Pa` : "—"}
              </strong>{" "}
              on Earth here but only <strong>{number(q.mars, 2)} Pa</strong> in
              the Mars scenario
              {equalQ != null
                ? `; Mars would need about ${number(equalQ, 0)} m/s for the same dynamic pressure.`
                : "."}{" "}
              On the Moon it is effectively zero.
            </p>
            <div
              className="lab-chart"
              aria-label="Dynamic pressure against wind speed, logarithmic axis"
            >
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={series}
                  margin={{ top: 4, right: 16, bottom: 22, left: 8 }}
                >
                  <CartesianGrid stroke="#223247" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="v"
                    stroke="#97A8BD"
                    fontSize={11}
                    label={{
                      value: "wind speed (m/s)",
                      position: "insideBottom",
                      offset: -8,
                      fill: "#97A8BD",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    scale="log"
                    domain={[0.001, 1000]}
                    allowDataOverflow
                    stroke="#97A8BD"
                    fontSize={11}
                    tickFormatter={(v: number) =>
                      v >= 1 ? String(v) : v.toString()
                    }
                    label={{
                      value: "q (Pa, log)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#97A8BD",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1322",
                      border: "1px solid #3a4b63",
                      fontSize: 12,
                    }}
                    formatter={(v) => `${Number(v).toFixed(3)} Pa`}
                    labelFormatter={(v) => `${v} m/s`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={26}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  {rhoE != null ? (
                    <Line
                      type="monotone"
                      dataKey="earth"
                      name="Earth (NASA POWER)"
                      stroke="#35C3B0"
                      dot={false}
                      strokeWidth={2}
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="mars"
                    name="Mars (scenario)"
                    stroke="#F17E5A"
                    dot={false}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                </LineChart>
              </ResponsiveContainer>
              <small>
                Moon: q ≈ 0 Pa at every speed (cannot be drawn on a logarithmic
                axis).
              </small>
            </div>
          </div>
        </div>
        <div className="limitation-banner" role="note">
          <TriangleAlert size={18} />
          <div>
            <strong>
              Equal dynamic pressure is not equal dust entrainment.
            </strong>
            <p>
              Dust lifting depends on soil cohesion, particle size and shape,
              surface friction, turbulence and electrostatics. Dynamic pressure
              alone does not model Martian dust storms. The Mars values are an
              illustrative scenario (600 Pa, 210 K, CO₂), not a Jezero
              measurement. On the Moon, aerodynamic dynamic pressure is taken as
              ≈ 0 ({MOON_APPROXIMATION.classification.toLowerCase()}).
            </p>
          </div>
        </div>
      </section>

      {/* MODULE C */}
      <section className="science-section lab-module">
        <div className="section-heading">
          <h2>
            <Mountain size={20} /> C · Transfer gap summary · Earth →{" "}
            {BODY_NAME[target]}
          </h2>
          <EvidenceTag kind="ASSUMED" />
        </div>
        <div className="gap-cards">
          {(
            [
              ["1", "Meaningfully comparable", gap.comparable, "ok"],
              [
                "2",
                "Needs scaling or controlled experiments",
                gap.scaling,
                "scale",
              ],
              [
                "3",
                "Needs vacuum, radiation, environmental or reduced-gravity facilities",
                gap.facilities,
                "facility",
              ],
              ["4", "Remains unvalidated", gap.unvalidated, "open"],
            ] as const
          ).map(([n, title, items, kind]) => (
            <div key={n} className={`gap-card ${kind}`}>
              <span className="mono">{n}</span>
              <h3>{title}</h3>
              <ul>
                {items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="caption">
          Deterministic templates with values computed above; no generated
          claims.
        </p>
      </section>
    </main>
  );
}
