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
  applyWeights,
  defaultWeights,
  rebalanceWeight,
  storedWeights,
} from "./lib/scoring";
const Explorer = lazy(() => import("./pages/Explorer"));
const SiteDetail = lazy(() => import("./pages/SiteDetail"));
const Passport = lazy(() => import("./pages/Passport"));
const Methodology = lazy(() => import("./pages/Methodology"));
const Compare = lazy(() => import("./pages/Compare"));
const Frontier = lazy(() => import("./pages/Frontier"));
const TransferLab = lazy(() => import("./pages/TransferLab"));
const WhatIf = lazy(() => import("./pages/WhatIf"));
function App() {
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState("");
  const [weights, setWeights] = useState(storedWeights);
  const assessed = useMemo(
    () => (data ? applyWeights(data, weights) : null),
    [data, weights],
  );
  useEffect(() => {
    try {
      localStorage.setItem("terrainx-weights-v1", JSON.stringify(weights));
    } catch {
      /* Storage optional. */
    }
  }, [weights]);
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
            change: (mission, key, value) =>
              setWeights((current) => ({
                ...current,
                [mission]: rebalanceWeight(current[mission], key, value),
              })),
            reset: (mission) =>
              setWeights((current) => ({
                ...current,
                [mission]: defaultWeights[mission],
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
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/frontier" element={<Frontier />} />
                <Route path="/transfer-lab" element={<TransferLab />} />
                <Route path="/what-if" element={<WhatIf />} />
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
