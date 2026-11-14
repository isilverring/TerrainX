import React, {
  Suspense,
  lazy,
  useEffect,
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import ReactDOM from "react-dom/client";
import {
  HashRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { DataContext, loadData } from "./lib/data";
import type { Dataset } from "./lib/models";
import { Header, Loading } from "./components/ui";
import Landing from "./pages/Landing";
import "./styles/index.css";
import "./styles/model.css";
import "./styles/refinements.css";
import "./styles/enhancements.css";
import {
  ModelContext,
  applyScenarios,
  rebalanceWeight,
  storedScenarios,
  validScenario,
} from "./lib/scoring";
import { defaultScenario } from "./lib/counterfactual";
import {
  releaseFromHash,
  activateRelease,
  type ScienceRelease,
} from "./lib/release";
import "./styles/research.css";
const Explorer = lazy(() => import("./pages/Explorer"));
const SiteDetail = lazy(() => import("./pages/SiteDetail"));
const Passport = lazy(() => import("./pages/Passport"));
const Methodology = lazy(() => import("./pages/Methodology"));
const Compare = lazy(() => import("./pages/Compare"));
const Frontier = lazy(() => import("./pages/Frontier"));
const TransferLab = lazy(() => import("./pages/TransferLab"));
const WhatIf = lazy(() => import("./pages/WhatIf"));
const Worlds = lazy(() => import("./pages/Worlds"));
const Demo = lazy(() => import("./pages/Demo"));
const Research = lazy(() => import("./pages/Research"));
function PinRelease() {
  const data = React.useContext(DataContext),
    location = useLocation(),
    navigate = useNavigate();
  useLayoutEffect(() => {
    if (!data?.release) return;
    const actual = window.location.hash.slice(1),
      separator = actual.indexOf("?"),
      pathname = (separator < 0 ? actual : actual.slice(0, separator)) || "/";
    const p = new URLSearchParams(
      separator < 0 ? "" : actual.slice(separator + 1),
    );
    if (!p.has("science")) {
      p.set("science", data.release.release_id);
      navigate({ pathname, search: p.toString() }, { replace: true });
    }
  }, [data?.release?.release_id, location.pathname, location.search, navigate]);
  return null;
}
function App() {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState("");
  const [scenarios, setScenarios] = useState(storedScenarios);
  const [releaseId, setReleaseId] = useState(releaseFromHash),
    loadedRelease = useRef<string | undefined>(undefined),
    loadedHash = useRef<string | undefined>(undefined);
  useEffect(() => {
    const change = () => {
      const p = new URLSearchParams(window.location.hash.split("?")[1]),
        id = p.get("science");
      if (id && id !== loadedRelease.current) setReleaseId(id);
      if (
        id === loadedRelease.current &&
        p.get("datahash") &&
        p.get("datahash") !== loadedHash.current
      ) {
        setError(
          "Saved study dataset hash does not match this immutable release. No results substituted.",
        );
        return;
      }
      try {
        const incoming = JSON.parse(p.get("model") ?? "null"),
          mission =
            p.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
        if (validScenario(incoming))
          setScenarios((current) => ({ ...current, [mission]: incoming }));
      } catch {}
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const weights = {
    jezero: scenarios.jezero.weights,
    "mare-crisium": scenarios["mare-crisium"].weights,
  };
  const assessed = useMemo(
    () => (data ? applyScenarios(data, scenarios) : null),
    [data, scenarios],
  );
  useEffect(() => {
    try {
      localStorage.setItem("terrainx-scenarios-v1", JSON.stringify(scenarios));
    } catch {
      /* Storage optional. */
    }
  }, [scenarios]);
  useEffect(() => {
    let live = true;
    setError("");
    setData(null);
    loadData(releaseId)
      .then((value) => {
        if (live) {
          loadedRelease.current = value.release?.release_id;
          loadedHash.current = value.release?.dataset_sha256;
          activateRelease(value.release as ScienceRelease);
          setData(value);
        }
      })
      .catch((e) => live && setError(String(e)));
    return () => {
      live = false;
    };
  }, [releaseId]);
  return (
    <HashRouter>
      <Header />
      {error ? (
        <main className="error-state">
          <h1>Scientific data could not be loaded.</h1>
          <p>
            The application stopped rather than showing unvalidated results.
          </p>
          <pre>{error}</pre>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Retry loading
          </button>
          <a className="button outline" href={window.location.pathname}>
            Open current release explicitly
          </a>
        </main>
      ) : data ? (
        <ModelContext.Provider
          value={{
            weights,
            scenarios,
            replace: setScenarios,
            update: (mission, patch) =>
              setScenarios((current) => ({
                ...current,
                [mission]: { ...current[mission], ...patch },
              })),
            change: (mission, key, value) =>
              setScenarios((current) => ({
                ...current,
                [mission]: {
                  ...current[mission],
                  weights: rebalanceWeight(
                    current[mission].weights,
                    key,
                    value,
                  ),
                },
              })),
            reset: (mission) =>
              setScenarios((current) => ({
                ...current,
                [mission]: defaultScenario(mission),
              })),
          }}
        >
          <DataContext.Provider value={assessed!}>
            <PinRelease />
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/site/:id" element={<SiteDetail />} />
                <Route path="/passport/:id" element={<Passport />} />
                <Route path="/expedition/:id" element={<Passport packet />} />
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/frontier" element={<Frontier />} />
                <Route path="/transfer-lab" element={<TransferLab />} />
                <Route path="/what-if" element={<WhatIf />} />
                <Route path="/worlds" element={<Worlds />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/research" element={<Research />} />
                <Route
                  path="*"
                  element={
                    <main className="error-state">
                      <h1>Page not found</h1>
                      <a href="#/explorer">Return to Discovery</a>
                    </main>
                  }
                />
              </Routes>
            </Suspense>
          </DataContext.Provider>
        </ModelContext.Provider>
      ) : (
        <Loading message="Validating cached NASA observations…" />
      )}
    </HashRouter>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
