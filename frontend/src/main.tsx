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
import "./styles/fieldstudy.css";
import "./styles/lenses.css";
import "./styles/palette.css";
import "./styles/cells.css";
import {
  initialPresentation,
  initialPresentationModels,
  presentationDefaults,
} from "./lib/presentation";
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
const FieldStudy = lazy(() => import("./pages/FieldStudy"));
const Lenses = lazy(() => import("./pages/Lenses"));
const CellSearch = lazy(() => import("./pages/CellSearch"));
const LunarPolar = lazy(() => import("./pages/LunarPolar"));
const ChallengeFit = lazy(() => import("./pages/ChallengeFit"));
import CommandPalette from "./components/CommandPalette";
const TerrainPilot = lazy(() => import("./pages/TerrainPilot"));
const Offline = lazy(() => import("./pages/Offline"));
const Cases = lazy(() => import("./pages/Cases"));
function PinRelease({ presentation }: { presentation: boolean }) {
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
    let changed = false;
    if (!p.has("science")) {
      p.set("science", data.release.release_id);
      changed = true;
    }
    if (presentation && !p.has("presentation")) {
      p.set("presentation", "1");
      changed = true;
    }
    if (changed) {
      navigate({ pathname, search: p.toString() }, { replace: true });
    }
  }, [
    data?.release?.release_id,
    location.pathname,
    location.search,
    navigate,
    presentation,
  ]);
  return null;
}
function App() {
  const route = useLocation();
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState("");
  const [scenarios, setScenarios] = useState(storedScenarios);
  const [presentation, setPresentation] = useState(initialPresentation),
    presentationRef = useRef(presentation);
  const [presentationModels, setPresentationModels] = useState(
    initialPresentationModels,
  );
  const effectiveModels = presentation ? presentationModels : scenarios;
  const editModels = presentation ? setPresentationModels : setScenarios;
  const [releaseId, setReleaseId] = useState(releaseFromHash),
    loadedRelease = useRef<string | undefined>(undefined),
    loadedHash = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    const change = () => {
      const hash = window.location.hash.slice(1),
        p = new URLSearchParams(hash.split("?")[1]),
        id = p.get("science");
      const demo = hash.split("?")[0] === "/demo",
        explicit = p.get("presentation");
      const mode =
        explicit === "0"
          ? false
          : demo || explicit === "1" || presentationRef.current;
      presentationRef.current = mode;
      setPresentation(mode);
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
          (mode ? setPresentationModels : setScenarios)((current) => ({
            ...current,
            [mission]: incoming,
          }));
      } catch {}
    };
    change();
  }, [route.pathname, route.search]);
  const weights = {
    jezero: effectiveModels.jezero.weights,
    "mare-crisium": effectiveModels["mare-crisium"].weights,
  };
  const assessed = useMemo(
    () => (data ? applyScenarios(data, effectiveModels) : null),
    [data, effectiveModels],
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
    <>
      <Header
        presentation={presentation}
        onEndPresentation={() => {
          presentationRef.current = false;
          setPresentation(false);
        }}
        onStartPresentation={() =>
          setPresentationModels(presentationDefaults())
        }
      />
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
      ) : data && (!releaseId || data.release?.release_id === releaseId) ? (
        <ModelContext.Provider
          value={{
            weights,
            scenarios: effectiveModels,
            replace: editModels,
            update: (mission, patch) =>
              editModels((current) => ({
                ...current,
                [mission]: { ...current[mission], ...patch },
              })),
            change: (mission, key, value) =>
              editModels((current) => ({
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
              editModels((current) => ({
                ...current,
                [mission]: defaultScenario(mission),
              })),
          }}
        >
          <DataContext.Provider value={assessed!}>
            <PinRelease presentation={presentation} />
            <CommandPalette />
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
                <Route path="/field-study" element={<FieldStudy />} />
                <Route path="/lenses" element={<Lenses />} />
                <Route path="/cells" element={<CellSearch />} />
                <Route path="/lunar-pole" element={<LunarPolar />} />
                <Route path="/challenge" element={<ChallengeFit />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/offline" element={<Offline />} />
                <Route path="/terrain-pilot" element={<TerrainPilot />} />
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
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
