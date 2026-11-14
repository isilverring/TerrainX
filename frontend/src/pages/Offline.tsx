import { useEffect, useState } from "react";
import { Download, WifiOff, CheckCircle2 } from "lucide-react";
import { useData } from "../lib/data";
import { offlineWorker, workerMessage, type Prepared } from "../lib/offline";
export default function Offline() {
  const data = useData(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [prepared, setPrepared] = useState<Prepared | null>(null),
    [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    let live = true;
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .getRegistration()
        .then(async (r) => {
          const worker = r?.waiting ?? r?.active;
          if (worker) {
            const reply = await workerMessage(worker, "STATUS");
            if (live) {
              setPrepared(reply.prepared ?? null);
              setWaiting(r?.waiting ?? null);
            }
          }
        })
        .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  async function prepare() {
    setBusy(true);
    setMessage("Checking production files…");
    try {
      const { registration, worker } = await offlineWorker();
      const reply = await workerMessage(
        worker,
        "PREPARE",
        data.release?.release_id,
        (p) =>
          setMessage(
            `Verified ${p.done} / ${p.total} files · ${((p.bytes ?? 0) / 1048576).toFixed(1)} MiB`,
          ),
      );
      setPrepared(reply.prepared ?? null);
      setWaiting(registration.waiting);
      setMessage("All files verified. Offline preparation is complete.");
    } catch (error) {
      setMessage(String(error));
    } finally {
      setBusy(false);
    }
  }
  async function activate() {
    if (!waiting) return;
    await workerMessage(waiting, "ACTIVATE");
    window.location.reload();
  }
  async function clear() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const worker = registration?.active ?? registration?.waiting;
      if (worker) await workerMessage(worker, "CLEAR");
      setPrepared(null);
      setWaiting(null);
      setMessage(
        "Prepared files cleared. Saved research studies remain in this browser.",
      );
    } catch (error) {
      setMessage(String(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="document-page research-page">
      <header className="document-title">
        <div>
          <p className="document-label">
            <WifiOff size={14} /> Prepare / audience demo
          </p>
          <h1>Take the science offline.</h1>
          <p>
            Prepare this browser before the presentation. TerrainX verifies and
            saves its application, science release, terrain grids, source
            metadata and NASA comparison images.
          </p>
        </div>
      </header>
      <div className="research-grid">
        <section className="research-card">
          <h2>A complete, checked demo</h2>
          <p>
            The map keeps its built-in geographic fallback. Satellite tiles,
            external source pages and third-party terrain tiles require a
            connection and are not downloaded.
          </p>
          <button className="button primary" disabled={busy} onClick={prepare}>
            <Download size={16} />
            {busy ? "Preparing…" : "Prepare offline demo"}
          </button>
          <p role="status" aria-live="polite">
            {message}
          </p>
          {prepared && (
            <div className="offline-ready">
              <h3>
                <CheckCircle2 size={18} /> Offline ready
              </h3>
              <dl>
                <dt>Build</dt>
                <dd className="mono">{prepared.build_id}</dd>
                <dt>Science</dt>
                <dd className="mono">{prepared.science_release}</dd>
                {prepared.historical_release && (
                  <>
                    <dt>Saved study release</dt>
                    <dd>{prepared.historical_release}</dd>
                  </>
                )}
                <dt>Verified</dt>
                <dd>
                  {prepared.files} files ·{" "}
                  {(prepared.bytes / 1048576).toFixed(1)} MiB
                </dd>
                <dt>Prepared</dt>
                <dd>{prepared.prepared_at}</dd>
              </dl>
            </div>
          )}
          {waiting && (
            <button className="button primary" onClick={activate}>
              Use prepared update and reload
            </button>
          )}
        </section>
        <section className="research-card">
          <h2>Rehearse before going on stage</h2>
          <ol>
            <li>Open the intended study and prepare while online.</li>
            <li>
              Reload once, then disable the network and run the guided demo.
            </li>
            <li>Open a dossier, Analog Forensics and an expedition export.</li>
            <li>Reconnect to open external citations or satellite imagery.</li>
          </ol>
          <p>
            Updates are prepared completely before replacing the cache. A failed
            verification keeps the previous complete version. Your browser may
            evict cached files under storage pressure; rehearse on the device
            you will use.
          </p>
          <button className="button outline" disabled={busy} onClick={clear}>
            Clear prepared files
          </button>
        </section>
      </div>
    </main>
  );
}
