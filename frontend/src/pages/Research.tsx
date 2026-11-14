import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Download, FolderOpen, Save, Upload, Trash2 } from "lucide-react";
import { useData } from "../lib/data";
import { useModel } from "../lib/scoring";
import {
  makeSnapshot,
  persistSnapshots,
  savedSnapshots,
  snapshotSchema,
  snapshotLink,
  checkSnapshotRelease,
} from "../lib/snapshots";
import type { ResearchSnapshot } from "../lib/snapshots";
import type { Mission } from "../lib/models";
import { download } from "../lib/packet";
import { BackLink } from "../components/ui";

export default function Research() {
  const data = useData(),
    model = useModel(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [title, setTitle] = useState("My planetary field study"),
    [mission, setMission] = useState<Mission>(
      params.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero",
    );
  const [candidate, setCandidate] = useState(
      params.get("id") ?? data.candidates[0].id,
    ),
    [saved, setSaved] = useState(savedSnapshots),
    [message, setMessage] = useState("");
  const store = (next: ResearchSnapshot[]) => {
    setSaved(next);
    setMessage(
      persistSnapshots(next)
        ? "Research snapshot saved on this device. Export a copy for recovery on another device."
        : "Browser storage is unavailable. Export the JSON snapshot to keep a durable copy.",
    );
  };
  const create = () => {
    let comparisons: string[] = [];
    try {
      comparisons = JSON.parse(
        localStorage.getItem("terrainx-compare-v1") ?? "[]",
      );
    } catch {}
    return makeSnapshot(
      data,
      model.scenarios,
      mission,
      candidate,
      title,
      Array.isArray(comparisons) ? comparisons : [],
    );
  };
  const open = (s: ResearchSnapshot) => {
    try {
      if (s.science.release_id === data.release?.release_id)
        checkSnapshotRelease(s, data);
      model.replace(s.scenarios);
      try {
        localStorage.setItem(
          "terrainx-compare-v1",
          JSON.stringify(s.comparison_ids),
        );
      } catch {}
      navigate(snapshotLink(s).slice(1));
    } catch (error) {
      setMessage(String(error));
    }
  };
  return (
    <main className="document-page research-page">
      <BackLink mission={mission} />
      <header className="document-title">
        <div>
          <p className="document-label">Reproducible research</p>
          <h1>Research workspace</h1>
          <p>
            Save a question, its model and the exact science release behind it.
          </p>
        </div>
      </header>
      <section className="science-section release-identity">
        <h2>Pinned science release</h2>
        <dl>
          <div>
            <dt>Release</dt>
            <dd className="mono">
              {data.release?.release_id ?? "unavailable"}
            </dd>
          </div>
          <div>
            <dt>Dataset SHA-256</dt>
            <dd className="mono hash-value">{data.release?.dataset_sha256}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{data.release?.model_version}</dd>
          </div>
        </dl>
        <p>
          Immutable cached inputs, model assumptions and geological evidence
          remain separate. Release-default downloads retain their original
          scores; your custom model is saved in the snapshot.
        </p>
      </section>
      <section className="science-section">
        <h2>Save this investigation</h2>
        <div className="research-form">
          <label>
            Study title
            <input
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Mission
            <select
              value={mission}
              onChange={(e) => setMission(e.target.value as Mission)}
            >
              <option value="jezero">Mars · Jezero</option>
              <option value="mare-crisium">Moon · Mare Crisium</option>
            </select>
          </label>
          <label>
            Candidate
            <select
              value={candidate}
              onChange={(e) => setCandidate(e.target.value)}
            >
              {data.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.benchmark ? " · benchmark" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="source-row">
          <button
            className="button primary"
            disabled={!title.trim()}
            onClick={() => {
              try {
                store([create(), ...saved].slice(0, 20));
              } catch (e) {
                setMessage(String(e));
              }
            }}
          >
            <Save size={16} /> Save snapshot
          </button>
          <button
            className="button outline"
            disabled={!title.trim()}
            onClick={() =>
              download(
                "terrainx-study.json",
                JSON.stringify(create(), null, 2),
                "application/json",
              )
            }
          >
            <Download size={16} /> Export snapshot JSON
          </button>
          <label className="button outline file-button">
            <Upload size={16} /> Import snapshot JSON
            <input
              type="file"
              accept="application/json,.json"
              aria-label="Import research snapshot"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 100000)
                    throw new Error("Snapshot file is too large");
                  const s = snapshotSchema.parse(JSON.parse(await file.text()));
                  store([s, ...saved].slice(0, 20));
                  open(s);
                } catch (error) {
                  setMessage(`Snapshot refused: ${String(error)}`);
                }
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <p role="status">{message}</p>
        <p className="caption">
          Stored on this device only. No account, cloud notebook or automatic
          upload. A missing historical release stops replay rather than silently
          changing its data.
        </p>
      </section>
      <section className="science-section">
        <h2>Saved investigations</h2>
        {!saved.length ? (
          <p>
            No saved studies yet. Choose a candidate and save your first
            snapshot.
          </p>
        ) : (
          <div className="research-snapshots">
            {saved.map((s, i) => (
              <article key={`${s.created_at}-${i}`}>
                <h3>{s.title}</h3>
                <p>
                  {s.mission} · {s.created_at.slice(0, 10)}
                </p>
                <p className="mono">{s.science.release_id}</p>
                <div className="source-row">
                  <button className="button primary" onClick={() => open(s)}>
                    <FolderOpen size={15} /> Reopen
                  </button>
                  <button
                    className="button outline"
                    onClick={() =>
                      download(
                        "terrainx-study.json",
                        JSON.stringify(s, null, 2),
                        "application/json",
                      )
                    }
                  >
                    <Download size={15} /> Export
                  </button>
                  <button
                    className="button outline"
                    aria-label={`Delete ${s.title}`}
                    onClick={() => store(saved.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <Link className="button outline" to="/methodology">
        Inspect model equations and limitations
      </Link>
    </main>
  );
}
