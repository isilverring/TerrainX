import { useMemo, useState } from "react";
import { number } from "../../lib/data";
import {
  autonomyWh,
  baseTradeoffs,
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

export default function Base({
  candidate,
  mission,
  sites,
  error,
  initialLunarId,
}: {
  sites?: IlluminationSite[];
  error?: string;
  initialLunarId?: string;
} & SiteContext) {
  const [solar, setSolar] = useState<number | null>(0.6),
    [slopeScale, setSlope] = useState<number | null>(20),
    [minSun, setMin] = useState<number | null>(0),
    [maxDark, setMax] = useState<number | null>(8760),
    [load, setLoad] = useState<number | null>(100),
    [usable, setUsable] = useState<number | null>(0.8),
    [chosen, setChosen] = useState(initialLunarId ?? "haworth");
  const result = useMemo(
    () =>
      calculate(() => {
        if (
          !sites ||
          solar === null ||
          slopeScale === null ||
          minSun === null ||
          maxDark === null
        )
          return null;
        return baseTradeoffs(sites, solar, slopeScale, minSun, maxDark);
      }),
    [sites, solar, slopeScale, minSun, maxDark],
  );
  const reference = sites?.find((s) => s.id === chosen),
    row = result.value?.find((r) => r.id === chosen);
  const storage = calculate(() =>
    reference && load !== null && usable !== null
      ? autonomyWh(load, reference.summary.max_sampled_dark_run_hours, usable)
      : null,
  );
  return (
    <>
      <Panel
        title="Expose the trade-offs before choosing a lunar test environment"
        eyebrow="Permanent-base research · bounded reference-centre screen"
      >
        <p>
          Explore actual LOLA slopes, Diviner stability models and2025SPICE/LOLA
          sunlight at eight named feature centres. These are not NASA landing
          polygons, engineered access routes or certified base sites.
        </p>
        {error && <p role="status">{error}</p>}
        <div className="lab-input-grid">
          <Numeric
            label="Relative sunlight importance"
            value={solar}
            onChange={setSolar}
            min={0}
            max={1}
            step={0.05}
          />
          <Numeric
            label="Declared terrain scale"
            value={slopeScale}
            onChange={setSlope}
            min={0.1}
            max={80}
            unit="p90slope degrees"
          />
          <Numeric
            label="Minimum sampled sunlight fraction"
            value={minSun}
            onChange={setMin}
            min={0}
            max={1}
            step={0.05}
          />
          <Numeric
            label="Maximum sampled dark run"
            value={maxDark}
            onChange={setMax}
            min={1}
            max={8760}
            unit="hours"
          />
        </div>
        <p className="lab-equation mono">
          index =100[w × sampled sunlight + (1−w) × max(0,1−p90slope / declared
          scale)]
        </p>
        <InputError message={result.error} />
        <p className="scientific-caveat">
          This separate experimental index ranks only these eight centre
          profiles under your assumptions. It is not F/U/C/P, calibrated mission
          suitability, certainty, a resource score or a recommended base.
          Required engineering/resource evidence is missing.
        </p>
        {result.value && (
          <div className="table-scroll">
            <table className="lab-table">
              <thead>
                <tr>
                  <th>Feature centre</th>
                  <th>Sampled sunlight</th>
                  <th>p90slope</th>
                  <th>Dark-run hours</th>
                  <th>Scenario index</th>
                  <th>Rule</th>
                </tr>
              </thead>
              <tbody>
                {result.value.map((r) => (
                  <tr key={r.id} className={r.id === chosen ? "is-chosen" : ""}>
                    <th>
                      <button
                        className="link-button"
                        onClick={() => setChosen(r.id)}
                      >
                        {r.name}
                      </button>
                    </th>
                    <td className="mono">{number(100 * r.solar, 2)}%</td>
                    <td className="mono">
                      {number(
                        sites!.find((s) => s.id === r.id)?.p90_slope_deg,
                        2,
                      )}
                      °
                    </td>
                    <td className="mono">{number(r.darkHours, 0)}</td>
                    <td className="mono">{number(r.index, 1)}</td>
                    <td>
                      {r.eligible ? "Within scenario" : "Outside scenario"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Turn the lighting constraint into an Earth experiment">
        <label className="lab-input">
          Lunar engineering reference
          <select value={chosen} onChange={(e) => setChosen(e.target.value)}>
            {sites?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="lab-metrics">
          <Metric label="Actual ice abundance" value="Unassessed" />
          <Metric label="Engineered access" value="Unassessed" />
          <Metric
            label="Diviner model stability within1m"
            value={number(
              reference?.model_stable_ice_area_fraction == null
                ? null
                : 100 * reference.model_stable_ice_area_fraction,
              2,
            )}
            unit="% modeled triangle area"
            hint="Different source/support; not ice detection, depth survey or abundance"
          />
        </div>
        <div className="lab-input-grid">
          <Numeric
            label="Illustrative equipment load"
            value={load}
            onChange={setLoad}
            min={1}
            unit="W"
          />
          <Numeric
            label="Usable storage fraction"
            value={usable}
            onChange={setUsable}
            min={0.01}
            max={1}
            step={0.05}
          />
        </div>
        <InputError message={storage.error} />
        <div className="lab-metrics">
          <Metric
            label="Dark-run autonomy scenario"
            value={
              storage.value === null ? null : number(storage.value / 1000, 2)
            }
            unit="kWh"
            hint="load × sampled dark-run hours / usable fraction"
          />
        </div>
        <p className="scientific-caveat">
          This energy balance excludes thermal losses, charging duty, equipment
          aging, eclipses and darkness outside the sampled year. It is a test
          requirement scenario, not battery sizing or a power-system design.
        </p>
      </Panel>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="base"
        polarId={chosen}
        question="Which controlled Earth test addresses this lunar operating constraint?"
        decision={
          row
            ? `The ${row.name} centre model gives a reproducible lighting/darkness constraint within its stated year and DEM support. Terrain and storage assumptions change the experimental index; resources and access remain unknown.`
            : "The required pinned lunar model is unavailable. No base recommendation was generated."
        }
        next="Use the selected Earth candidate to rehearse mapping/navigation and controlled lighting outages; specify load, autonomy, thermal sensors and success criteria. Use cold/vacuum/reduced-gravity facilities for conditions Earth terrain cannot reproduce; obtain finer lunar terrain, full-cycle illumination and direct resource/access evidence before engineering selection."
        inputs={{
          solarWeight: solar,
          slopeScaleDeg: slopeScale,
          minSun,
          maxDarkHours: maxDark,
          chosen,
          loadW: load,
          usableFraction: usable,
        }}
        results={{
          tradeoffs: result.value,
          autonomyWh: storage.value,
          resourceAbundance: null,
          engineeringAccess: null,
        }}
        sources={[
          "https://naif.jpl.nasa.gov/naif/spiceconcept.html",
          "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/",
          "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/",
        ]}
      />
    </>
  );
}
