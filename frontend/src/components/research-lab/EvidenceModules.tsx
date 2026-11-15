import { useState } from "react";
import { number } from "../../lib/data";
import {
  assayQuality,
  caveStations,
  compositionClosure,
  parseReplicates,
  resourceRecovery,
  type EvidenceRecord,
} from "../../lib/researchLab";
import SiteEvidence from "../SiteEvidence";
import {
  calculate,
  InputError,
  Metric,
  Numeric,
  Outcome,
  Panel,
  References,
  type SiteContext,
} from "./Shared";

type Props = SiteContext & { records: EvidenceRecord[] };
export function Minerals({ candidate, mission, records }: Props) {
  const [rows, setRows] = useState([
      { name: "Constituent 1", value: null as number | null },
      { name: "Constituent 2", value: null as number | null },
    ]),
    [tolerance, setTolerance] = useState<number | null>(5);
  const result = calculate(() => {
    if (tolerance === null) throw Error("Enter a closure tolerance.");
    if (
      new Set(rows.map((r) => r.name.trim().toLowerCase())).size !== rows.length
    )
      throw Error(
        "Name distinct, nonoverlapping constituents; do not count one phase twice.",
      );
    return compositionClosure(
      rows.map((r) => r.value),
      tolerance,
    );
  });
  const selected = records.filter((r) => r.categories.includes("mineralogy"));
  const load = () => {
    const source = selected.find((r) => r.id === "salda-l1-xrd-2026");
    if (source)
      setRows(
        source.observations
          .filter((o) =>
            o.label.toLowerCase().includes("microbialite interior"),
          )
          .map((o) => ({
            name: o.label,
            value: typeof o.value === "number" ? o.value : null,
          })),
      );
  };
  return (
    <>
      <Panel
        title="From mapped rock to tested material"
        eyebrow="Mineralogy · source evidence and sample QA"
      >
        <p>
          {candidate.assessments[mission].utility.criteria.geology.rationale}
        </p>
        <p className="scientific-caveat">
          Regional mapped lithology is not mineral identification. The published
          specimen records below retain their own positions and methods; they do
          not upgrade another screened cell.
        </p>
        <SiteEvidence id={candidate.id} />
      </Panel>
      <Panel title="Check a reported composition">
        <p>
          Enter nonoverlapping phase or oxide percentages from one sample and
          one method. Empty values remain unknown. Normalization is a
          calculation, not a mineralogical classification.
        </p>
        <div className="lab-composition">
          {rows.map((r, i) => (
            <div key={i}>
              <label className="lab-input">
                Constituent name
                <input
                  value={r.name}
                  aria-label={`Constituent${i + 1} name`}
                  onChange={(e) =>
                    setRows(
                      rows.map((v, j) =>
                        j === i ? { ...v, name: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
              <Numeric
                label={`Constituent${i + 1} percentage`}
                value={r.value}
                unit="mass% / phase% (same basis)"
                min={0}
                max={100}
                step={0.1}
                onChange={(v) =>
                  setRows(
                    rows.map((row, j) =>
                      j === i ? { ...row, value: v } : row,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
        <div className="toolbar-actions">
          <button
            className="button outline"
            onClick={() =>
              setRows([
                ...rows,
                { name: `Constituent${rows.length + 1}`, value: null },
              ])
            }
            disabled={rows.length >= 10}
          >
            Add constituent
          </button>
          <button className="button outline" onClick={load}>
            Load published Salda XRD specimen
          </button>
        </div>
        <Numeric
          label="Declared closure tolerance"
          value={tolerance}
          unit="percentage points around 100%"
          min={0}
          max={25}
          onChange={setTolerance}
        />
        <InputError message={result.error} />
        <div className="lab-metrics">
          <Metric
            label="Reported sum"
            value={result.value ? number(result.value.total, 2) : null}
            unit="%"
          />
          <Metric
            label="Closure screen"
            value={
              result.value?.closurePass === null
                ? "Incomplete"
                : result.value?.closurePass
                  ? "Within rule"
                  : "Outside rule"
            }
            hint="Experimental QA tolerance, not a NASA criterion"
          />
        </div>
        {result.value?.normalized && (
          <p className="mono">
            Calculated normalization:{" "}
            {result.value.normalized.map((v) => number(v, 2) + "%").join(" / ")}
          </p>
        )}
      </Panel>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="mineralogy"
        question="Which local material measurement would establish mission relevance?"
        decision={
          selected.some((r) => r.candidate_id === candidate.id)
            ? "Published specimen evidence exists for this reference locality. Its spatial and laboratory scope must be checked against the proposed subsite."
            : "Mapped context alone does not resolve the selected site's mineral phases. Composition closure cannot fill that evidence gap."
        }
        next="Collect permitted, georeferenced samples; pair field context with XRD/Raman and calibrated XRF/petrology, replicates and reference materials. Test the mission-specific material/process hypothesis before changing geological relevance."
        inputs={{
          classification: "USER-ENTERED OR SOURCE-LOADED COMPOSITION",
          rows,
          tolerance,
        }}
        results={result.value}
        sources={selected.flatMap((r) => r.references.map((s) => s.url))}
      />
      <References records={selected} candidate={candidate} />
    </>
  );
}

export function Resources({ candidate, mission, records }: Props) {
  const [bulk, setBulk] = useState<number | null>(100),
    [water, setWater] = useState<number | null>(null),
    [efficiency, setEfficiency] = useState<number | null>(80),
    [spread, setSpread] = useState<number | null>(null),
    [preset, setPreset] = useState(false);
  const selected = records.filter(
    (r) =>
      r.categories.includes("resources") ||
      r.categories.includes("water_environment"),
  );
  const result = calculate(() => {
    if (bulk === null || water === null || efficiency === null) return null;
    return resourceRecovery(bulk, water, efficiency, preset ? spread : null);
  });
  return (
    <>
      <Panel
        title="Separate a detection, a stability model and an unknown"
        eyebrow="Resource evidence"
      >
        <p>
          Wetness, cold temperature, modeled ice stability and measured water
          abundance answer different questions. Published borehole and LCROSS
          records below are independent references.
        </p>
        <div className="lab-metrics">
          <Metric
            label="Selected-site ice abundance"
            value="Unassessed"
            hint="No remote reference value is transferred"
          />
          <Metric
            label="Local resource reserve"
            value="Unassessed"
            hint="Requires geometry, grade, recoverability and access evidence"
          />
        </div>
      </Panel>
      <Panel title="Design a controlled recovery experiment">
        <p>
          Scenario mass balance: recovered water = bulk mixture mass × water
          mass fraction × recovery efficiency. This does not estimate an Earth
          or lunar reserve.
        </p>
        <button
          className="button outline"
          onClick={() => {
            setWater(5.6);
            setSpread(2.9);
            setPreset(true);
          }}
        >
          Use LCROSS-inspired mixture scenario
        </button>
        <p className="caption">
          This preset uses the source's5.6±2.9wt% ejecta estimate as a
          laboratory-mixture scenario. It is not an observation at{" "}
          {candidate.name} or another lunar feature. The source spread is 1 SD,
          not a guaranteed range.
        </p>
        <div className="lab-input-grid">
          <Numeric
            label="Proposed bulk mixture mass"
            value={bulk}
            onChange={setBulk}
            min={0.01}
            step={1}
            unit="kg"
          />
          <Numeric
            label="Scenario water mass fraction"
            value={water}
            onChange={(v) => {
              setWater(v);
              setPreset(false);
            }}
            min={0}
            max={100}
            step={0.1}
            unit="wt%"
          />
          <Numeric
            label="Scenario recovery efficiency"
            value={efficiency}
            onChange={setEfficiency}
            min={0}
            max={100}
            unit="%"
          />
        </div>
        <InputError message={result.error} />
        <div className="lab-metrics">
          <Metric
            label="Scenario recovered water"
            value={result.value ? number(result.value.recoveredKg, 3) : null}
            unit="kg"
          />
          {result.value?.rangeKg && (
            <Metric
              label="Propagated source ±1 SD endpoints"
              value={result.value.rangeKg.map((v) => number(v, 3)).join(" – ")}
              unit="kg"
              hint="Fixed bulk mass/efficiency; not full experimental uncertainty"
            />
          )}
        </div>
      </Panel>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="resources"
        question="What would establish a usable resource at the selected subsite?"
        decision="The reference data distinguish actual sampled water, a historical permafrost temperature and modeled environmental context. None establishes the selected site's resource grade or recoverability."
        next="Acquire dated depth-resolved thermal records and permitted direct gravimetric/chemical ice-water assays. For recovery tests, measure starting/recovered mass, temperature, pressure, blanks and losses; use a controlled cold/vacuum facility where required."
        inputs={{
          bulkKg: bulk,
          waterPercent: water,
          recoveryPercent: efficiency,
          preset: preset ? "LCROSS-inspired scenario" : "User scenario",
        }}
        results={result.value}
        sources={selected.flatMap((r) => r.references.map((s) => s.url))}
      />
      <References records={selected} candidate={candidate} />
    </>
  );
}

export function Biology({ candidate, mission, records }: Props) {
  const [sample, setSample] = useState(""),
    [blank, setBlank] = useState(""),
    [measured, setMeasured] = useState<number | null>(null),
    [expected, setExpected] = useState<number | null>(null),
    [k, setK] = useState<number | null>(3),
    [unit, setUnit] = useState("relative fluorescence units");
  const selected = records.filter(
    (r) =>
      r.categories.includes("biology") ||
      r.categories.includes("biosignatures"),
  );
  const result = calculate(() => {
    if (k === null) throw Error("Enter the declared blank multiplier.");
    return assayQuality(
      parseReplicates(sample),
      parseReplicates(blank),
      measured,
      expected,
      k,
    );
  });
  return (
    <>
      <Panel
        title="A biosignature needs a method and controls"
        eyebrow="Biology · contamination and interpretation"
      >
        <p>
          Salda microscopy and Yungay laboratory assays are source-scoped
          evidence. GBIF reporting counts do not measure microbial scarcity,
          sterility or habitability.
        </p>
        <p className="scientific-caveat">
          Yungay's published lower-bound cell count followed laboratory
          incubation. It is not a fresh in-situ biomass count or a number to
          transfer into this selected cell.
        </p>
      </Panel>
      <Panel title="Screen the quality of an assay signal">
        <p>
          Enter your own linear-signal replicates in the same unit. Nothing is
          prefilled as a field result. This declared screen uses blank mean + k
          × blank sample SD and positive-control recovery within±20%.
        </p>
        <div className="lab-input-grid">
          <label className="lab-input">
            Sample replicate signals
            <textarea
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              placeholder="At least 2 comma-separated values"
            />
          </label>
          <label className="lab-input">
            Blank replicate signals
            <textarea
              value={blank}
              onChange={(e) => setBlank(e.target.value)}
              placeholder="At least 3 comma-separated values"
            />
          </label>
          <label className="lab-input">
            Assay signal unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
          <Numeric
            label="Positive-control measured signal"
            value={measured}
            onChange={setMeasured}
            step={0.1}
            unit={unit}
          />
          <Numeric
            label="Expected positive-control increment"
            value={expected}
            onChange={setExpected}
            min={0.001}
            step={0.1}
            unit={unit}
          />
          <Numeric
            label="Declared blank SD multiplier"
            value={k}
            onChange={setK}
            min={0}
            max={10}
            step={0.5}
          />
        </div>
        <InputError message={result.error} />
        {result.value?.state === "incomplete" && (
          <p role="status" className="lab-empty">
            {result.value.reason}
          </p>
        )}
        {result.value?.state === "assessed" && (
          <>
            <div className="lab-metrics">
              <Metric
                label="Background-corrected mean"
                value={number(result.value.backgroundCorrected, 3)}
                unit={unit}
              />
              <Metric
                label="Declared signal threshold"
                value={number(result.value.threshold, 3)}
                unit={unit}
              />
              <Metric
                label="Positive-control recovery"
                value={number(100 * result.value.recovery, 1)}
                unit="%"
              />
            </div>
            <p role="status" className="scientific-caveat">
              {!result.value.controlsPass
                ? "Control recovery fails the declared rule; sample signal is not interpreted."
                : result.value.signalAboveThreshold
                  ? "Signal exceeds the declared blank rule. Independent identification and contamination evidence are still required."
                  : "Signal does not exceed this rule. Absence of life is not established."}
            </p>
          </>
        )}
      </Panel>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="biology"
        question="Can the sampling workflow distinguish signal from contamination?"
        decision="The calculation evaluates a declared assay-control rule. It does not identify an organism, establish an indigenous biosignature, or infer a sterile/habitable site."
        next="Predeclare sampling depth, chain of custody, field/process blanks, instrument calibration, positive controls and a second independent identification method. Report detection limits and processed-versus-in-situ conditions; obtain permissions before sampling."
        inputs={{
          classification: "USER-SUPPLIED ASSAY SIGNALS / UNVERIFIED",
          sample,
          blank,
          positiveMeasured: measured,
          positiveExpected: expected,
          k,
          unit,
        }}
        results={result.value}
        sources={selected.flatMap((r) => r.references.map((s) => s.url))}
      />
      <References records={selected} candidate={candidate} />
    </>
  );
}

export function Caves({ candidate, mission, records }: Props) {
  const caveRecords = records.filter((r) => r.categories.includes("caves")),
    [id, setId] = useState("nps-indian-tunnel"),
    [length, setLength] = useState<number | null>(100),
    [spacing, setSpacing] = useState<number | null>(20),
    [speed, setSpeed] = useState<number | null>(0.5),
    [dwell, setDwell] = useState<number | null>(5);
  const selected = caveRecords.find((r) => r.id === id);
  const result = calculate(() => {
    if (length === null || spacing === null || speed === null || dwell === null)
      return null;
    return caveStations(length, spacing, speed, dwell);
  });
  return (
    <>
      <Panel
        title="Use documented voids, not a host-rock guess"
        eyebrow="Verified existence · entrance survey still required"
      >
        <p>
          This inventory contains source-documented lava tubes. None has a
          verified surveyed entrance coordinate in the consulted sources, so
          TerrainX does not invent cave waypoints.
        </p>
        <label className="lab-input">
          Documented cave reference
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {caveRecords.map((r) => (
              <option value={r.id} key={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
        <p className="scientific-caveat">
          {selected?.candidate_id === candidate.id
            ? "This cave is associated with the benchmark park; its centre is not an entrance or a surveyed interior position."
            : `This is an independent reference, not a detected cave at ${candidate.name}.`}{" "}
          Current access, permits, protection and roof/route conditions require
          authoritative verification.
        </p>
      </Panel>
      <Panel title="Plan a relative mapping and sensor transect">
        <p>
          Offsets start from a future surveyed origin. The 100 m default is a user
          scenario, not a measured accessible passage. No absolute coordinates
          or safe-route claim are generated.
        </p>
        <div className="lab-input-grid">
          <Numeric
            label="Proposed transect length"
            value={length}
            onChange={setLength}
            min={1}
            unit="m"
          />
          <Numeric
            label="Proposed station spacing"
            value={spacing}
            onChange={setSpacing}
            min={1}
            unit="m"
          />
          <Numeric
            label="Scenario movement speed"
            value={speed}
            onChange={setSpeed}
            min={0.01}
            step={0.1}
            unit="m/s"
          />
          <Numeric
            label="Observation dwell per station"
            value={dwell}
            onChange={setDwell}
            min={0}
            unit="minutes"
          />
        </div>
        <InputError message={result.error} />
        {result.value && (
          <>
            <div className="lab-metrics">
              <Metric
                label="Relative proposed stations"
                value={result.value.stations.length}
              />
              <Metric
                label="One-way timing scenario"
                value={number(result.value.oneWayMinutes, 1)}
                unit="minutes"
                hint="Excludes return, hazards, access and operational delays"
              />
            </div>
            <details>
              <summary>Inspect proposed station offsets</summary>
              <table className="lab-table">
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Relative distance</th>
                    <th>Absolute position</th>
                  </tr>
                </thead>
                <tbody>
                  {result.value.stations.map((s) => (
                    <tr key={s.label}>
                      <th>{s.label}</th>
                      <td className="mono">
                        {number(s.distanceFromSurveyedOriginM, 1)}m
                      </td>
                      <td>Unassessed</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </Panel>
      <Outcome
        candidate={candidate}
        mission={mission}
        module="caves"
        question="Could a permitted subsurface experiment test navigation or sensor workflows?"
        decision="Documented cave existence supports reference experiments, while host-rock keywords alone do not establish a cave at the selected research candidate. Relative station planning does not establish access or stability."
        next="Verify authoritative access/permit requirements and a surveyed entrance/interior geometry. Use non-contact LiDAR/photogrammetry, light and temperature logging, localization repeatability and contamination controls; planetary vacuum, gravity and radiation remain unreproduced."
        inputs={{
          reference: id,
          lengthM: length,
          spacingM: spacing,
          speedMps: speed,
          dwellMinutes: dwell,
        }}
        results={result.value}
        sources={selected?.references.map((s) => s.url)}
      />
      <References records={selected ? [selected] : []} candidate={candidate} />
    </>
  );
}
