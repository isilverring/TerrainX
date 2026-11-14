import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Compass,
  Download,
  Link2,
  FolderOpen,
  MapPinned,
  Plus,
  Printer,
  Route,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useData, number } from "../lib/data";
import { useModel } from "../lib/scoring";
import { makeSnapshot, checkSnapshotRelease } from "../lib/snapshots";
import type { Mission } from "../lib/models";
import { download } from "../lib/packet";
import {
  STATION_KINDS,
  SAMPLE_FIELDS,
  compass,
  decodeShare,
  elevationAt,
  encodeShare,
  stationsFromShare,
  equipmentFor,
  fieldStudySchema,
  legs,
  naismithHours,
  newFieldStudy,
  persistFieldStudies,
  reliefTransect,
  sampleId,
  savedFieldStudies,
  terrainGrid,
  toGpx,
  toLocal,
  traverseProfile,
  traverseTotals,
  type FieldStudy as Study,
  type Station,
  type StationKind,
} from "../lib/fieldStudy";
import FieldPlanner from "../components/FieldPlanner";
import QrCode from "../components/QrCode";
import { BackLink } from "../components/ui";

const MISSION_LABEL: Record<Mission, string> = {
  jezero: "Mars · Jezero Crater",
  "mare-crisium": "Moon · Mare Crisium",
};
/** Longest URL we render as a QR code (byte-mode capacity at error level M is ~2.3 kB). */
const QR_MAX = 1100;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "field-study";

export default function FieldStudy() {
  const data = useData(),
    model = useModel(),
    [params] = useSearchParams();
  const eligible = useMemo(() => data.candidates.filter((c) => terrainGrid(c)), [data]);
  const initialCandidate =
    eligible.find((c) => c.id === params.get("id"))?.id ??
    eligible.find((c) => c.status === "CHARACTERIZED CANDIDATE")?.id ??
    eligible[0]?.id;
  const initialMission: Mission = params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";

  const fresh = (candidateId: string, mission: Mission, title?: string): Study => {
    const c = data.candidates.find((x) => x.id === candidateId)!;
    const snapshot = makeSnapshot(data, model.scenarios, mission, c.id, title ?? `Field study · ${c.name}`);
    return newFieldStudy(snapshot, c, mission, title ?? `Field study · ${c.name}`);
  };
  // A ?share= link reopens the same stations and intent, only on the identical release.
  const shared = useMemo(() => {
    const code = params.get("share");
    if (!code) return null;
    try {
      const s = decodeShare(code);
      if (s.r !== data.release?.release_id)
        return { error: `This shared plan was made on ${s.r}; this site serves ${data.release?.release_id}. No newer data were substituted.` };
      const c = data.candidates.find((x) => x.id === s.c);
      if (!c || !terrainGrid(c)) return { error: "The shared candidate is not in this release." };
      return { share: s };
    } catch {
      return { error: "This share link is damaged or incomplete." };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [study, setStudy] = useState<Study>(() => {
    if (shared && "share" in shared && shared.share) {
      const s = shared.share,
        base = fresh(s.c, s.m, s.t);
      return { ...base, hypothesis: s.h || base.hypothesis, stations: stationsFromShare(s) };
    }
    return fresh(initialCandidate, initialMission);
  });
  const [kind, setKind] = useState<StationKind>("observation"),
    [selected, setSelected] = useState<string | null>(null),
    [saved, setSaved] = useState(savedFieldStudies),
    [message, setMessage] = useState(() =>
      shared && "error" in shared
        ? `Shared plan not opened: ${shared.error}`
        : shared
          ? "Opened a shared plan: stations, title and hypothesis. Protocol lists start from the dataset defaults — save it to keep a copy."
          : "",
    ),
    [newItem, setNewItem] = useState({ measurements: "", equipment: "" }),
    [mapImage, setMapImage] = useState<string | null>(null);
  const base = `${window.location.origin}${window.location.pathname}#/field-study?share=`;
  const shareUrl = base + encodeShare(study),
    qrUrl = base + encodeShare(study, true);

  const candidate = data.candidates.find((c) => c.id === study.candidate_id)!;
  const grid = useMemo(() => terrainGrid(candidate)!, [candidate]);
  const exp = candidate.assessments[study.mission].experiment;
  const assessment = candidate.assessments[study.mission];

  const update = (patch: Partial<Study>) =>
    setStudy((s) => ({ ...s, ...patch, updated_at: new Date().toISOString() }));
  const setStations = (stations: Station[]) => {
    // Equipment grows with the station types used; user ticks and custom items are kept.
    const have = new Set(study.equipment.map((e) => e.text));
    const extra = equipmentFor(exp, stations)
      .filter((t) => !have.has(t))
      .map((text) => ({ text, done: false }));
    update({ stations, equipment: [...study.equipment, ...extra] });
  };
  const nextId = () => {
    const used = new Set(study.stations.map((s) => s.id));
    for (let i = 1; ; i++) {
      const id = `S${String(i).padStart(2, "0")}`;
      if (!used.has(id)) return id;
    }
  };

  const profile = useMemo(() => traverseProfile(grid, study.stations, 200), [grid, study.stations]);
  const totals = traverseTotals(profile);
  const legList = legs(grid, study.stations);
  const stationZ = (s: Station) => {
    const p = toLocal(grid, s);
    return elevationAt(grid, p.x, p.y);
  };
  const stationMarks = profile.filter((p) => p.station && p.z != null);

  useEffect(() => setSelected(null), [study.candidate_id]);

  const switchTo = (candidateId: string, mission: Mission) => {
    if (study.stations.length && !window.confirm("Start a new field study? Unsaved stations will be cleared."))
      return;
    setStudy(fresh(candidateId, mission));
    setMessage("");
  };
  const store = (next: Study[], note: string) => {
    setSaved(next);
    setMessage(persistFieldStudies(next) ? note : "Browser storage is unavailable — export the JSON to keep this study.");
  };
  const save = () => {
    const snapshot = { ...study.snapshot, title: study.title };
    const s = fieldStudySchema.parse({ ...study, snapshot, updated_at: new Date().toISOString() });
    store([s, ...saved.filter((x) => x.id !== s.id)].slice(0, 20), "Field study saved on this device, pinned to its science release.");
    setStudy(s);
  };
  const open = (s: Study) => {
    try {
      checkSnapshotRelease(s.snapshot, data);
      setStudy(s);
      setSelected(null);
      setMessage(`Reopened “${s.title}”. Scores shown use your active model; the study keeps the model saved with it.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(String(error));
    }
  };

  const sampleStations = study.stations.filter((s) => s.kind === "sample");
  const permitsAnswered = study.permits.filter((p) => p.answer.trim()).length;
  const readiness = [
    { label: "Hypothesis", ok: study.hypothesis.trim().length > 20 },
    { label: "≥2 stations", ok: study.stations.length >= 2 },
    { label: "Sample station", ok: sampleStations.length > 0 },
    { label: "Every station has a purpose", ok: study.stations.length > 0 && study.stations.every((s) => s.purpose.trim()) },
    { label: "Access questions answered", ok: permitsAnswered === study.permits.length },
    { label: "Equipment packed", ok: study.equipment.length > 0 && study.equipment.every((e) => e.done) },
  ];
  const ready = readiness.filter((r) => r.ok).length;

  if (!candidate || !grid) return null;
  const sel = study.stations.find((s) => s.id === selected) ?? null;

  return (
    <main className="document-page field-page">
      <BackLink mission={study.mission} />
      <header className="document-title field-title">
        <div>
          <p className="document-label">Prepare · Field Study Builder</p>
          <h1>Turn a candidate into a field question.</h1>
          <p>
            Place proposed stations on the real cached terrain samples, measure the traverse, and leave with a
            protocol, GPX waypoints and a printable field book — all pinned to the science release that produced
            the candidate.
          </p>
        </div>
        <div className="field-readiness" aria-label={`Plan readiness ${ready} of ${readiness.length}`}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="27" className="track" />
            <circle
              cx="32"
              cy="32"
              r="27"
              className="value"
              strokeDasharray={`${(ready / readiness.length) * 169.6} 169.6`}
            />
          </svg>
          <strong>
            {ready}/{readiness.length}
          </strong>
          <span>plan readiness</span>
          <ul>
            {readiness.map((r) => (
              <li key={r.label} className={r.ok ? "ok" : ""}>
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section className="field-setup" aria-label="Study setup">
        <label className="field-span">
          Study title
          <input value={study.title} maxLength={120} onChange={(e) => update({ title: e.target.value || " " })} />
        </label>
        <label>
          Earth candidate
          <select value={study.candidate_id} onChange={(e) => switchTo(e.target.value, study.mission)}>
            {eligible.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.benchmark ? " · reference analog" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Planetary mission
          <select value={study.mission} onChange={(e) => switchTo(study.candidate_id, e.target.value as Mission)}>
            <option value="jezero">{MISSION_LABEL.jezero}</option>
            <option value="mare-crisium">{MISSION_LABEL["mare-crisium"]}</option>
          </select>
        </label>
        <div className="field-pin">
          <span className="mono">{study.snapshot.science.release_id}</span>
          <span>
            F {number(assessment.fidelity.value, 0)} · U {number(assessment.utility.value, 0)} · C{" "}
            {Math.round(assessment.utility.coverage * 100)}% · {candidate.status.toLowerCase()}
          </span>
        </div>
      </section>

      <section className="field-workbench">
        <div className="field-map-col">
          <div className="field-toolbar" role="toolbar" aria-label="Station tools">
            <span>New station:</span>
            {(Object.keys(STATION_KINDS) as StationKind[]).map((k) => (
              <button
                key={k}
                className={`field-kind ${k === kind ? "active" : ""}`}
                aria-pressed={k === kind}
                onClick={() => setKind(k)}
                style={{ ["--tint" as string]: STATION_KINDS[k].tint }}
              >
                <i aria-hidden="true">{STATION_KINDS[k].glyph}</i>
                {STATION_KINDS[k].label}
              </button>
            ))}
          </div>
          <FieldPlanner
            grid={grid}
            stations={study.stations}
            selected={selected}
            onSelect={setSelected}
            onAdd={(lat, lon) => {
              if (study.stations.length >= 24) return setMessage("A field study holds at most 24 stations.");
              const id = nextId();
              setStations([
                ...study.stations,
                { id, name: `Station ${study.stations.length + 1}`, kind, lat, lon, purpose: "" },
              ]);
              setSelected(id);
            }}
            onMove={(id, lat, lon) =>
              update({ stations: study.stations.map((s) => (s.id === id ? { ...s, lat, lon } : s)) })
            }
            onRemove={(id) => {
              setStations(study.stations.filter((s) => s.id !== id));
              setSelected(null);
            }}
          />
          <div className="source-row field-map-actions">
            <button
              className="button outline"
              onClick={() => {
                if (study.stations.length && !window.confirm("Replace the current stations with a suggested transect?"))
                  return;
                setStations(reliefTransect(grid));
                setSelected(null);
              }}
            >
              <Sparkles size={15} /> Suggest relief transect
            </button>
            <button
              className="button outline"
              disabled={study.stations.length < 2}
              onClick={() => update({ stations: [...study.stations].reverse() })}
            >
              <Route size={15} /> Reverse order
            </button>
            <button
              className="button outline"
              disabled={!study.stations.length}
              onClick={() => {
                if (window.confirm("Remove all stations?")) setStations([]);
              }}
            >
              <Trash2 size={15} /> Clear
            </button>
          </div>
          <p className="caption">
            The suggestion runs from the lowest to the highest real sample node — a deterministic way to cross the
            sampled relief, not a recommendation of a safe or permitted route.
          </p>
        </div>

        <aside className="field-stations" aria-label="Stations">
          <h2>
            Stations <span>{study.stations.length}/24</span>
          </h2>
          {!study.stations.length && (
            <div className="field-empty">
              <MapPinned size={22} />
              <p>Click the terrain to place your first station, or ask for a suggested relief transect.</p>
            </div>
          )}
          <ol>
            {study.stations.map((s, i) => {
              const z = stationZ(s);
              return (
                <li
                  key={s.id}
                  className={s.id === selected ? "selected" : ""}
                  style={{ ["--tint" as string]: STATION_KINDS[s.kind].tint }}
                >
                  <button className="field-station-head" onClick={() => setSelected(s.id === selected ? null : s.id)}>
                    <b>{i + 1}</b>
                    <span>
                      <strong>{s.name}</strong>
                      <small className="mono">
                        {s.lat.toFixed(5)}, {s.lon.toFixed(5)} · {z == null ? "—" : `≈${Math.round(z)} m`}
                      </small>
                    </span>
                    <em>{STATION_KINDS[s.kind].label}</em>
                  </button>
                  {s.id === selected && sel && (
                    <div className="field-station-edit">
                      <label>
                        Name
                        <input
                          value={sel.name}
                          maxLength={80}
                          onChange={(e) =>
                            update({
                              stations: study.stations.map((x) =>
                                x.id === s.id ? { ...x, name: e.target.value || " " } : x,
                              ),
                            })
                          }
                        />
                      </label>
                      <label>
                        Type
                        <select
                          value={sel.kind}
                          onChange={(e) =>
                            setStations(
                              study.stations.map((x) =>
                                x.id === s.id ? { ...x, kind: e.target.value as StationKind } : x,
                              ),
                            )
                          }
                        >
                          {(Object.keys(STATION_KINDS) as StationKind[]).map((k) => (
                            <option key={k} value={k}>
                              {STATION_KINDS[k].label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field-span">
                        Purpose — what would you observe or test here?
                        <textarea
                          rows={2}
                          maxLength={400}
                          value={sel.purpose}
                          onChange={(e) =>
                            update({
                              stations: study.stations.map((x) =>
                                x.id === s.id ? { ...x, purpose: e.target.value } : x,
                              ),
                            })
                          }
                        />
                      </label>
                      <div className="field-station-tools">
                        <button
                          className="button outline"
                          disabled={i === 0}
                          onClick={() => {
                            const a = [...study.stations];
                            [a[i - 1], a[i]] = [a[i], a[i - 1]];
                            update({ stations: a });
                          }}
                        >
                          ↑ Earlier
                        </button>
                        <button
                          className="button outline"
                          disabled={i === study.stations.length - 1}
                          onClick={() => {
                            const a = [...study.stations];
                            [a[i + 1], a[i]] = [a[i], a[i + 1]];
                            update({ stations: a });
                          }}
                        >
                          ↓ Later
                        </button>
                        <button
                          className="button outline"
                          aria-label={`Remove ${s.name}`}
                          onClick={() => {
                            setStations(study.stations.filter((x) => x.id !== s.id));
                            setSelected(null);
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="caption">
            Stations are your proposals. Access, exposure quality and safety are unknown until checked on the
            ground.
          </p>
        </aside>
      </section>

      <section className="science-section field-traverse">
        <h2>
          <Compass size={22} /> Proposed traverse
        </h2>
        {study.stations.length < 2 ? (
          <p className="caption">Place at least two stations to measure the traverse.</p>
        ) : (
          <>
            <div className="field-stats">
              <div>
                <span>Straight-line distance</span>
                <strong>{(totals.distanceM / 1000).toFixed(2)} km</strong>
              </div>
              <div>
                <span>Ascent / descent (trend)</span>
                <strong>
                  +{Math.round(totals.ascentM)} / −{Math.round(totals.descentM)} m
                </strong>
              </div>
              <div>
                <span>Elevation span</span>
                <strong>
                  {totals.minZ == null ? "—" : `${Math.round(totals.minZ)}–${Math.round(totals.maxZ!)} m`}
                </strong>
              </div>
              <div>
                <span>Naismith walking time</span>
                <strong>{naismithHours(totals.distanceM, totals.ascentM).toFixed(1)} h</strong>
              </div>
            </div>
            <div className="field-profile" role="img" aria-label="Elevation trend along the proposed traverse">
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={profile.map((p) => ({ km: p.d / 1000, z: p.z }))} margin={{ top: 14, right: 16, bottom: 4, left: 0 }}>
                  <defs>
                    <linearGradient id="fsProfile" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3ec9b0" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#3ec9b0" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1d2a3d" vertical={false} />
                  <XAxis
                    dataKey="km"
                    type="number"
                    domain={[0, "dataMax"]}
                    tickFormatter={(v: number) => `${v.toFixed(0)} km`}
                    stroke="#6c7e95"
                    fontSize={11}
                  />
                  <YAxis
                    domain={["dataMin - 20", "dataMax + 20"]}
                    tickFormatter={(v: number) => `${Math.round(v)} m`}
                    stroke="#6c7e95"
                    fontSize={11}
                    width={58}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0d1624", border: "1px solid #29384e", borderRadius: 6 }}
                    formatter={(v) => [`${Math.round(Number(v))} m`, "Interpolated elevation"]}
                    labelFormatter={(v) => `${Number(v).toFixed(2)} km along traverse`}
                  />
                  <Area type="linear" dataKey="z" stroke="#3ec9b0" strokeWidth={2} fill="url(#fsProfile)" connectNulls={false} isAnimationActive={false} />
                  {stationMarks.map((p, i) => (
                    <ReferenceDot key={i} x={p.d / 1000} y={p.z!} r={4} fill="#f2f5fa" stroke="#080d18" />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="table-scroll">
              <table className="field-legs">
                <thead>
                  <tr>
                    <th>Leg</th>
                    <th>Distance</th>
                    <th>Bearing</th>
                    <th>Δ elevation (trend)</th>
                  </tr>
                </thead>
                <tbody>
                  {legList.map((l, i) => (
                    <tr key={i}>
                      <td>
                        {l.from.id} → {l.to.id}
                      </td>
                      <td className="mono">{(l.distanceM / 1000).toFixed(2)} km</td>
                      <td className="mono">
                        {Math.round(l.bearing)}° {compass(l.bearing)}
                      </td>
                      <td className="mono">{l.dz == null ? "—" : `${l.dz >= 0 ? "+" : "−"}${Math.abs(Math.round(l.dz))} m`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="caption">
              Great-circle legs on the 6371 km sphere used by discovery. Elevations come from straight-line sampling of
              the interpolated 4 km SRTM grid, so real ascent along a walked route will be larger. Naismith’s rule (5
              km/h plus 1 h per 600 m of ascent) is a planning heuristic for fit walkers, not a schedule.
            </p>
          </>
        )}
      </section>

      <section className="science-section field-protocol">
        <h2>Protocol</h2>
        <div className="field-protocol-grid">
          <label className="field-span">
            Hypothesis to test
            <textarea rows={3} maxLength={1200} value={study.hypothesis} onChange={(e) => update({ hypothesis: e.target.value })} />
          </label>
          <label className="field-span">
            Objective
            <input maxLength={400} value={study.objective} onChange={(e) => update({ objective: e.target.value })} />
          </label>
          {(["measurements", "equipment"] as const).map((key) => (
            <fieldset key={key} className="field-checklist">
              <legend>{key === "measurements" ? "Measurements" : "Equipment"}</legend>
              <ul>
                {study[key].map((item, i) => (
                  <li key={`${item.text}-${i}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() =>
                          update({ [key]: study[key].map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })
                        }
                      />
                      <span>{item.text}</span>
                    </label>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${item.text}`}
                      onClick={() => update({ [key]: study[key].filter((_, j) => j !== i) })}
                    >
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="field-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = newItem[key].trim();
                  if (!text) return;
                  update({ [key]: [...study[key], { text: text.slice(0, 300), done: false }] });
                  setNewItem({ ...newItem, [key]: "" });
                }}
              >
                <input
                  placeholder={key === "measurements" ? "Add a measurement…" : "Add an item…"}
                  value={newItem[key]}
                  maxLength={300}
                  onChange={(e) => setNewItem({ ...newItem, [key]: e.target.value })}
                />
                <button className="button outline" type="submit" aria-label={`Add to ${key}`}>
                  <Plus size={14} />
                </button>
              </form>
            </fieldset>
          ))}
          <fieldset className="field-checklist field-samples">
            <legend>Sample documentation</legend>
            <ul className="field-plain">
              {SAMPLE_FIELDS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="caption">
              {sampleStations.length
                ? `Label scheme: ${sampleStations.map((s) => sampleId(candidate, s)).join(", ")}`
                : "Add a Sample station to generate label IDs."}
            </p>
          </fieldset>
          <label className="field-span">
            Success indicators
            <textarea
              rows={3}
              maxLength={1200}
              value={study.success_indicators}
              onChange={(e) => update({ success_indicators: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="science-section field-access">
        <h2>
          Permits, access and local knowledge <span className="field-count">{permitsAnswered}/{study.permits.length}</span>
        </h2>
        <div className="field-permits">
          {study.permits.map((p, i) => (
            <label key={p.question}>
              {p.question}
              <input
                value={p.answer}
                maxLength={600}
                placeholder="Answer, contact or ‘unknown’"
                onChange={(e) =>
                  update({ permits: study.permits.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })
                }
              />
            </label>
          ))}
        </div>
        <label className="field-notes">
          Local notes
          <textarea
            rows={4}
            maxLength={4000}
            value={study.local_notes}
            placeholder="Seasonality, community contacts, road conditions, partner institutions…"
            onChange={(e) => update({ local_notes: e.target.value })}
          />
        </label>
        <div className="field-limits">
          <h3>What this Earth site cannot reproduce</h3>
          <ul>
            {exp.cannot_reproduce.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p>{exp.unvalidated}</p>
        </div>
      </section>

      <section className="science-section field-actions-section">
        <h2>Save, share and take it outside</h2>
        <div className="source-row">
          <button className="button primary" onClick={save}>
            <Save size={16} /> Save field study
          </button>
          <button
            className="button outline"
            onClick={() => download(`terrainx-${slug(study.title)}.json`, JSON.stringify(study, null, 2), "application/json")}
          >
            <Download size={16} /> Export JSON
          </button>
          <button
            className="button outline"
            disabled={!study.stations.length}
            onClick={() => download(`terrainx-${slug(study.title)}.gpx`, toGpx(study, candidate, grid), "application/gpx+xml")}
          >
            <MapPinned size={16} /> Export GPX
          </button>
          <button
            className="button outline"
            onClick={() => {
              // Freeze the current planner view into the printed field book.
              const canvas = document.querySelector<HTMLCanvasElement>(".field-canvas");
              try {
                setMapImage(canvas ? canvas.toDataURL("image/png") : null);
              } catch {
                setMapImage(null);
              }
              requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
            }}
          >
            <Printer size={16} /> Print field book
          </button>
          <button
            className="button outline"
            disabled={!study.stations.length}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                setMessage(`Share link copied (${shareUrl.length} characters). It opens these stations only on ${study.snapshot.science.release_id}.`);
              } catch {
                window.prompt("Copy this share link", shareUrl);
              }
            }}
          >
            <Link2 size={16} /> Copy share link
          </button>
          <label className="button outline file-button">
            <Upload size={16} /> Import JSON
            <input
              type="file"
              accept="application/json,.json"
              aria-label="Import field study"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 200000) throw new Error("Field study file is too large");
                  const s = fieldStudySchema.parse(JSON.parse(await file.text()));
                  checkSnapshotRelease(s.snapshot, data);
                  store([s, ...saved.filter((x) => x.id !== s.id)].slice(0, 20), `Imported “${s.title}”.`);
                  setStudy(s);
                } catch (error) {
                  setMessage(`Field study refused: ${String(error)}`);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p role="status" className="field-message">
          {message}
        </p>
        <p className="caption">
          Stored on this device only. The JSON carries the full research snapshot (release, dataset SHA-256 and
          model), so a colleague opening it sees exactly the evidence you planned from. GPX opens in field GPS apps.
        </p>
        {saved.length > 0 && (
          <div className="research-snapshots field-saved">
            {saved.map((s) => (
              <article key={s.id} className={s.id === study.id ? "current" : ""}>
                <h3>{s.title}</h3>
                <p>
                  {data.candidates.find((c) => c.id === s.candidate_id)?.name ?? s.candidate_id} ·{" "}
                  {MISSION_LABEL[s.mission]} · {s.stations.length} stations
                </p>
                <p className="mono">
                  {s.snapshot.science.release_id} · {s.updated_at.slice(0, 10)}
                </p>
                <div className="source-row">
                  <button className="button primary" onClick={() => open(s)}>
                    <FolderOpen size={15} /> Reopen
                  </button>
                  <button
                    className="button outline"
                    aria-label={`Delete ${s.title}`}
                    onClick={() => store(saved.filter((x) => x.id !== s.id), "Field study deleted from this device.")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p>
          <Link to={`/research?id=${candidate.id}&mission=${study.mission}`}>Open the research workspace</Link> ·{" "}
          <Link to={`/site/${candidate.id}?mission=${study.mission}`}>Analog DNA for this candidate</Link>
        </p>
      </section>

      <FieldBook study={study} shareUrl={study.stations.length && qrUrl.length <= QR_MAX ? qrUrl : null} mapImage={mapImage} candidateName={candidate.name} stationZ={stationZ} sampleLabel={(s, n) => sampleId(candidate, s, n)} />
    </main>
  );
}

/** Print-only field book: protocol, station sheets with blank observation lines, cut-out sample labels. */
function FieldBook({
  study,
  shareUrl,
  mapImage,
  candidateName,
  stationZ,
  sampleLabel,
}: {
  study: Study;
  shareUrl: string | null;
  mapImage: string | null;
  candidateName: string;
  stationZ: (s: Station) => number | null;
  sampleLabel: (s: Station, n: number) => string;
}) {
  const samples = study.stations.filter((s) => s.kind === "sample");
  return (
    <section className="fieldbook-print" aria-hidden="true">
      <header className="fb-header">
        {shareUrl && (
          <div className="fb-qr">
            <QrCode value={shareUrl} size={190} label="Open this field study's stations" />
            <span>Scan to open these stations</span>
          </div>
        )}
        <p>TerrainX field book · proposal, not a verified plan</p>
        <h1>{study.title}</h1>
        <p>
          {candidateName} · {MISSION_LABEL[study.mission]} · {study.snapshot.science.release_id} · dataset
          SHA-256 {study.snapshot.science.dataset_sha256.slice(0, 16)}… · printed {new Date().toISOString().slice(0, 10)}
        </p>
      </header>
      {mapImage && (
        <figure className="fb-map">
          <img src={mapImage} alt="" />
          <figcaption>
            Planner view: relief interpolated between real SRTM samples (dots, 4 km spacing). Stations are
            proposals; access and exposure are unverified.
          </figcaption>
        </figure>
      )}
      <h2>Hypothesis</h2>
      <p>{study.hypothesis}</p>
      <h2>Objective</h2>
      <p>{study.objective}</p>
      <h2>Success indicators</h2>
      <p>{study.success_indicators}</p>
      <h2>Stations</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name / type</th>
            <th>Lat, lon (WGS84)</th>
            <th>≈ Elev.</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {study.stations.map((s) => {
            const z = stationZ(s);
            return (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>
                  {s.name}
                  <br />
                  {STATION_KINDS[s.kind].label}
                </td>
                <td>
                  {s.lat.toFixed(6)}, {s.lon.toFixed(6)}
                </td>
                <td>{z == null ? "—" : `${Math.round(z)} m`}</td>
                <td>{s.purpose}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2>Checklists</h2>
      <div className="fb-cols">
        <div>
          <h3>Measurements</h3>
          <ul>
            {study.measurements.map((m) => (
              <li key={m.text}>☐ {m.text}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Equipment</h3>
          <ul>
            {study.equipment.map((m) => (
              <li key={m.text}>☐ {m.text}</li>
            ))}
          </ul>
        </div>
      </div>
      <h2>Access and permits</h2>
      <ul>
        {study.permits.map((p) => (
          <li key={p.question}>
            {p.question} <b>{p.answer || "________________"}</b>
          </li>
        ))}
      </ul>
      {study.local_notes && (
        <>
          <h2>Local notes</h2>
          <p>{study.local_notes}</p>
        </>
      )}
      {study.stations.map((s) => (
        <div className="fb-sheet" key={s.id}>
          <h2>
            {s.id} · {s.name}
          </h2>
          <p>
            Planned {s.lat.toFixed(6)}, {s.lon.toFixed(6)} · Actual GNSS: ____________ ± ____ m · Time (UTC): ______
          </p>
          <p>Lithology / grain size / structures:</p>
          <div className="fb-lines" />
          <p>Photos (IDs, scale, direction): ______________________ · Samples taken: ______________</p>
        </div>
      ))}
      {samples.length > 0 && (
        <>
          <h2>Sample labels (cut out)</h2>
          <div className="fb-labels">
            {samples.flatMap((s) =>
              [1, 2, 3].map((n) => (
                <div key={`${s.id}-${n}`}>
                  <b>{sampleLabel(s, n)}</b>
                  <span>{s.name}</span>
                  <span>Date ________ GNSS ________</span>
                </div>
              )),
            )}
          </div>
        </>
      )}
    </section>
  );
}
