import React, { Suspense, lazy, useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
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
} from "./lib/scoring";
import { defaultScenario } from "./lib/counterfactual";
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
function App() {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState("");
  const [scenarios, setScenarios] = useState(storedScenarios);
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
    loadData()
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);
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
        </main>
      ) : data ? (
        <ModelContext.Provider
          value={{
            weights,
            scenarios,
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
