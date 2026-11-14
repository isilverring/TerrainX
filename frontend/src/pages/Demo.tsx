import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { geoEquirectangular, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import type { FeatureCollection, Point } from "geojson";
import { useData, number } from "../lib/data";
import { fetchScienceJson } from "../lib/release";
import { beyondKnown } from "../lib/story";
import { frontier, measurementsFor } from "../lib/frontier";
import {
  GRAVITY,
  MARS_SCENARIO,
  dynamicPressure,
  earthAtmosphere,
  froudeMatchedSpeed,
} from "../lib/physics";

/** "From Earth to another world": a manual 90-second narrative built from real values. */
function WorldMap({ cells }: { cells: [number, number][] }) {
  const data = useData();
  const [land, setLand] = useState<GeoPermissibleObjects | null>(null);
  useEffect(() => {
    fetchScienceJson<GeoPermissibleObjects>("land.geojson")
      .then(setLand)
      .catch(() => {});
  }, []);
  const projection = geoEquirectangular().scale(140).translate([440, 230]);
  const path = geoPath(projection);
  return (
    <svg
      className="demo-map"
      viewBox="0 0 880 420"
      role="img"
      aria-label="World map with the four study regions, 130 screened cells and four benchmark references"
    >
      {land ? (
        <path
          d={path(land) ?? ""}
          fill="#1d3149"
          stroke="#3b5674"
          strokeWidth=".5"
        />
      ) : null}
      {data.regions.map((r) => {
        const [w, s, e, n] = r.bounds;
        const [x0, y0] = projection([w, n])!,
          [x1, y1] = projection([e, s])!;
        return (
          <rect
            key={r.id}
            x={x0 - 4}
            y={y0 - 4}
            width={x1 - x0 + 8}
            height={y1 - y0 + 8}
            fill="#35C3B022"
            stroke="#C6D7E8"
            strokeDasharray="3 2"
          />
        );
      })}
      {cells.map(([lon, lat], i) => {
        const [x, y] = projection([lon, lat])!;
        return <circle key={i} cx={x} cy={y} r="1.6" fill="#35C3B0" />;
      })}
      {data.candidates
        .filter((c) => c.benchmark)
        .map((c) => {
          const [x, y] = projection([c.longitude, c.latitude])!;
          return (
            <rect
              key={c.id}
              x={x - 5}
              y={y - 5}
              width="10"
              height="10"
              transform={`rotate(45 ${x} ${y})`}
              fill="#111a29"
              stroke="#C6D7E8"
              strokeWidth="1.8"
            />
          );
        })}
    </svg>
  );
}

export default function Demo() {
  const data = useData(),
    navigate = useNavigate();
  const [i, setI] = useState(0);
  const [cells, setCells] = useState<[number, number][]>([]);
  useEffect(() => {
    fetchScienceJson<FeatureCollection<Point>>("screened_cells.geojson")
      .then((fc: FeatureCollection<Point>) =>
        setCells(
          fc.features.map((f) => f.geometry.coordinates as [number, number]),
        ),
      )
      .catch(() => {});
  }, []);
  const story = useMemo(() => beyondKnown(data, "jezero"), [data]);
  const best = story.bestExploratory;
  const contrast = useMemo(
    () =>
      data.candidates
        .filter(
          (c) => !c.benchmark && c.assessments.jezero.utility.coverage < 0.7,
        )
        .sort(
          (a, b) =>
            (b.assessments.jezero.utility.value ?? 0) -
            (a.assessments.jezero.utility.value ?? 0),
        )[0],
    [data],
  );
  const top = useMemo(
    () =>
      data.candidates
        .filter((c) => !c.benchmark && c.assessments.jezero.priority != null)
        .sort(
          (a, b) =>
            b.assessments.jezero.priority! - a.assessments.jezero.priority!,
        )
        .slice(0, 3),
    [data],
  );
  const frontierRow = useMemo(
    () => frontier(data.candidates, "jezero")[0],
    [data],
  );
  const atm = best ? earthAtmosphere(best) : null;
  const rhoE = atm && "density" in atm ? atm.density! : null;
  const qE = rhoE != null ? dynamicPressure(rhoE, 10) : null,
    qM = dynamicPressure(MARS_SCENARIO.density!, 10);
  const scenes = [
    {
      kicker: "Scene 1 · The challenge",
      title:
        "Before we explore another world, we need to understand where to practice on ours.",
      body: (
        <>
          <p>
            The 2026 NASA Space Apps challenge asks teams to identify and
            characterize Earth locations that act as analogs for permanent Moon
            base locations and Mars, using open NASA and space-agency data.
          </p>
          <p className="demo-sub">
            Earth Science · Planets & Moons · Software · Space Exploration
          </p>
        </>
      ),
    },
    {
      kicker: "Scene 2 · The gap",
      title:
        "We already know some Earth analogs. But we may be overlooking useful environments.",
      body: (
        <>
          <WorldMap cells={cells} />
          <p>
            {data.summary.benchmark_sites} documented benchmarks (◇) versus a
            reproducible search of{" "}
            <strong>{data.summary.screened_cells}</strong> real NASA POWER cells
            in four study regions.
          </p>
        </>
      ),
    },
    {
      kicker: "Scene 3 · The discovery",
      title: "NASA observations help us identify promising research locations.",
      body: (
        <>
          <div className="demo-funnel">
            <div>
              <b className="mono">{data.summary.screened_cells}</b>
              <span>cells screened</span>
            </div>
            <div>
              <b className="mono">{data.summary.shortlisted_candidates}</b>
              <span>algorithmic candidates</span>
            </div>
            <div>
              <b className="mono">{data.summary.characterized_candidates}</b>
              <span>characterized (preliminary)</span>
            </div>
          </div>
          <ol className="demo-list">
            {top.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>
                <span className="mono">
                  P {number(c.assessments.jezero.priority, 1)} · F{" "}
                  {number(c.assessments.jezero.fidelity.value, 0)} · U{" "}
                  {number(c.assessments.jezero.utility.value, 0)}
                </span>
              </li>
            ))}
          </ol>
          <p className="demo-sub">
            Mars / Jezero screening priority among evidence-eligible candidates
            — not a winner.
          </p>
        </>
      ),
    },
    {
      kicker: "Scene 4 · The science",
      title:
        "Terrain similarity is not the same as mission-testing usefulness.",
      body: (
        <div className="demo-compare">
          {[best, contrast].filter(Boolean).map((c) => {
            const a = c!.assessments.jezero;
            return (
              <div key={c!.id} className="demo-card">
                <h3>{c!.name}</h3>
                {(
                  [
                    ["F", a.fidelity.value],
                    ["U", a.utility.value],
                    ["C", 100 * a.utility.coverage],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="demo-bar">
                    <span>{k}</span>
                    <i>
                      <em
                        style={{ width: `${v ?? 0}%` }}
                        className={k === "C" && (v ?? 0) < 70 ? "low" : ""}
                      />
                    </i>
                    <b className="mono">{number(v, 0)}</b>
                  </div>
                ))}
                <p>{a.utility.criteria.geology.rationale}</p>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      kicker: "Scene 5 · The reality gap",
      title: "Earth cannot reproduce every planetary physical condition.",
      body: (
        <div className="demo-physics">
          <div>
            <b className="mono">{(GRAVITY.mars / GRAVITY.earth).toFixed(2)}×</b>
            <span>
              Mars gravity relative to Earth (
              {(GRAVITY.moon / GRAVITY.earth).toFixed(2)}× for the Moon)
            </span>
          </div>
          <div>
            <b className="mono">
              {froudeMatchedSpeed(1, GRAVITY.mars).toFixed(2)} m/s
            </b>
            <span>
              Mars speed with the same Froude number as a 1 m/s Earth test (same
              length)
            </span>
          </div>
          <div>
            <b className="mono">
              {qE != null ? number(qE, 0) : "—"} Pa vs {number(qM, 2)} Pa
            </b>
            <span>
              Dynamic pressure of a 10 m/s wind at{" "}
              {best?.name ?? "the Earth site"} (density derived from NASA POWER
              means; hypothetical wind) vs the labelled Mars scenario
            </span>
          </div>
          <p className="demo-sub">
            Froude matching and dynamic pressure are not full physical
            similarity.
          </p>
        </div>
      ),
    },
    {
      kicker: "Scene 6 · The next experiment",
      title:
        "Turn a possible analog into a testable mission research question.",
      body: best ? (
        <>
          <p className="demo-quote">
            “{best.assessments.jezero.experiment.hypothesis}”
          </p>
          <p>
            <strong>Proposed success indicator:</strong>{" "}
            {best.assessments.jezero.experiment.success_indicator}
          </p>
          {frontierRow ? (
            <p>
              <strong>Measure next at {frontierRow.candidate.name}:</strong>{" "}
              {measurementsFor(frontierRow.swings[0].key, "jezero")
                .methods.slice(0, 2)
                .join(" · ")}{" "}
              — its U could lie anywhere from{" "}
              {number(frontierRow.bounds.min, 0)} to{" "}
              {number(frontierRow.bounds.max, 0)} until geology is measured.
            </p>
          ) : null}
          <Link
            className="button primary"
            to={`/passport/${best.id}?mission=jezero`}
          >
            Open the Analog Passport
          </Link>
        </>
      ) : (
        <p>No characterized candidate for this mission.</p>
      ),
    },
    {
      kicker: "Final",
      title: "TerrainX",
      body: (
        <>
          <img
            src="/brand/terrainx-mark.svg"
            width="120"
            height="109"
            alt="TerrainX orbital X"
            className="demo-brand-mark"
          />
          <p className="demo-final">Earth is the training ground.</p>
          <p className="demo-sub">
            Independent research prototype · open NASA data · no NASA
            endorsement implied.
          </p>
        </>
      ),
    },
  ];
  const last = scenes.length - 1;
  const go = useCallback(
    (n: number) => setI(Math.max(0, Math.min(last, n))),
    [last],
  );
  const exit = useCallback(() => navigate("/explorer"), [navigate]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Escape") exit();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(last);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, exit, last]);
  const scene = scenes[i];
  return (
    <div
      className="demo"
      role="dialog"
      aria-modal="true"
      aria-label="From Earth to another world — guided demo"
    >
      <div className="demo-top">
        <span className="demo-brand">From Earth to another world</span>
        <span className="mono demo-count">
          {i + 1} / {scenes.length}
        </span>
        <button className="demo-exit" onClick={exit} aria-label="Exit demo">
          <X size={18} /> Exit
        </button>
      </div>
      <section key={i} className="demo-scene" aria-live="polite">
        <p className="demo-kicker">{scene.kicker}</p>
        <h1>{scene.title}</h1>
        <div className="demo-body">{scene.body}</div>
      </section>
      <div className="demo-nav">
        <button
          className="button outline"
          onClick={() => go(i - 1)}
          disabled={i === 0}
        >
          <ArrowLeft size={16} /> Previous
        </button>
        <div className="demo-dots" role="tablist" aria-label="Scenes">
          {scenes.map((s, n) => (
            <button
              key={n}
              role="tab"
              aria-selected={n === i}
              aria-label={s.kicker}
              className={n === i ? "active" : ""}
              onClick={() => go(n)}
            />
          ))}
        </div>
        {i < last ? (
          <button className="button primary" onClick={() => go(i + 1)}>
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button className="button primary" onClick={exit}>
            Explore <ArrowRight size={16} />
          </button>
        )}
      </div>
      <p className="demo-keys">← → to navigate · Esc to exit</p>
    </div>
  );
}
