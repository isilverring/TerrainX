import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Dna,
  FlaskConical,
  Globe2,
  Map as MapIcon,
  Moon,
  GraduationCap,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DEFAULT_ALPHA, DEFAULT_TOLERANCES, DEFAULT_WEIGHTS } from "../lib/counterfactual";
import { useData } from "../lib/data";
import { useScienceFile } from "../lib/scienceFile";
import { cellLabel, cellSearchSchema } from "../lib/cellSearch";
import { lunarPolarSchema } from "../lib/lunarPolar";
import { GRAVITY } from "../lib/physics";
import { DIMENSIONS } from "./ChallengeFit";
import QrCode from "../components/QrCode";
import "../styles/pitch.css";

type Slide = { tag: string; title: ReactNode; visual: ReactNode; foot?: ReactNode };

/** Ten-slide pitch with numbers read from the pinned scientific release. */
export default function Pitch() {
  const data = useData(),
    navigate = useNavigate(),
    [i, setI] = useState(0),
    root = useRef<HTMLDivElement>(null);
  const cells = useScienceFile("cell_search.json", cellSearchSchema, "absent").value;
  const polar = useScienceFile("lunar_polar.json", lunarPolarSchema, "absent").value;
  const mars = cells?.missions.jezero;
  const twins = (polar?.sites ?? [])
    .filter((s) => s.artemis_region && s.earth_twins?.length)
    .sort((a, b) => b.earth_twins![0].F - a.earth_twins![0].F)
    .slice(0, 4);
  // Same naming rule as the lunar pole page: released candidates by name, cells by region and position.
  const twinName = (id: string, fallback: string) => {
    const known = data.candidates.find((c) => c.id === id)?.name;
    if (known) return known;
    const m = /^([a-z]+)-(-?\d+\.\d+)-(-?\d+\.\d+)$/.exec(id),
      region = data.regions.find((r) => r.id === m?.[1])?.name;
    return m && region ? (
      <>
        {region}
        <small className="mono">{cellLabel({ latitude: +m[2], longitude: +m[3] })}</small>
      </>
    ) : (
      fallback
    );
  };
  const covered = DIMENSIONS.filter((d) => d.status === "covered").length,
    bounded = DIMENSIONS.filter((d) => d.status === "bounded").length;
  const appUrl = `${window.location.origin}${window.location.pathname}`;
  const total = cells?.cells ?? data.summary.screened_cells,
    eligible = mars?.eligible ?? 0,
    picks = mars?.shortlist.length ?? 0;

  const slides: Slide[] = [
    {
      tag: "The challenge",
      title: (
        <>
          Where on <em>Earth</em> can we rehearse
          <br /> the <em className="moon">Moon</em> and <em className="mars">Mars</em>?
        </>
      ),
      visual: (
        <svg className="pv-worlds" viewBox="0 0 900 300" aria-hidden="true">
          <path className="pv-route" d="M210 150 C 380 40, 540 40, 690 80" />
          <path className="pv-route late" d="M210 150 C 380 260, 560 260, 760 220" />
          <circle className="pv-earth" cx="160" cy="150" r="78" />
          <circle className="pv-moon" cx="700" cy="78" r="30" />
          <circle className="pv-mars" cx="770" cy="222" r="40" />
          <text x="160" y="268">Earth</text>
          <text x="700" y="30">Permanent Moon base</text>
          <text x="770" y="290">Mars</text>
        </svg>
      ),
      foot: "NASA Space Apps 2026 · Identify Earth locations that analog permanent Moon-base locations and Mars",
    },
    {
      tag: "The gap → our answer",
      title: "Three gaps. Three answers.",
      visual: (
        <ol className="pv-gaps">
          {[
            ["A handful of famous sites", "Search every cell with NASA data", "130-cell search · atlas"],
            ["“Dry” taken as “Mars-like”", "Score what the mission needs", "F · U · C · Analog DNA"],
            ["Unknowns left unsaid", "Label them, then test them", "Research Lab · field protocol"],
          ].map(([gap, answer, tool], n) => (
            <li key={gap} style={{ animationDelay: `${0.15 * n}s` }}>
              <span className="pv-gap">
                <span className="pv-dot gap" />
                {gap}
              </span>
              <span className="pv-arrow" aria-hidden="true" />
              <span className="pv-answer">
                <span className="pv-dot" />
                <b>{answer}</b>
              </span>
              <span className="pv-tool">{tool}</span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      tag: "Our approach",
      title: "Four steps, one pipeline.",
      visual: (
        <div className="pv-flow">
          {[
            ["Observe", "Open NASA & ESA data"],
            ["Compare", "Fidelity · Utility · Coverage"],
            ["Explain", "What matches, what fails"],
            ["Test", "A field protocol"],
          ].map(([a, b], n) => (
            <div key={a} className="pv-step" style={{ animationDelay: `${0.2 * n}s` }}>
              <span className="pv-node">{n + 1}</span>
              <b>{a}</b>
              <span>{b}</span>
            </div>
          ))}
          <span className="pv-pulse" aria-hidden="true" />
        </div>
      ),
    },
    {
      tag: "The science",
      title: "Three scores, never blended blindly.",
      visual: (
        <div className="pv-science">
          <div className="pv-eq">
            <span className="pv-eq-name">Fidelity</span>
            <span className="pv-math">
              F = 100 · mean<sub>i</sub> exp(−½ ((E<sub>i</sub> − P<sub>i</sub>) / τ<sub>i</sub>)²)
            </span>
            <span className="pv-eq-note">
              Earth vs planet terrain: slope, p90 slope, relief, roughness · τ ={" "}
              {DEFAULT_TOLERANCES.median_slope_deg}°, {DEFAULT_TOLERANCES.p90_slope_deg}°,{" "}
              {DEFAULT_TOLERANCES.relief_m} m, {DEFAULT_TOLERANCES.detrended_rms_m} m
            </span>
          </div>
          <div className="pv-eq">
            <span className="pv-eq-name">Utility · Coverage</span>
            <span className="pv-math">
              U = 100 · Σ w<sub>k</sub>u<sub>k</sub> / Σ<sub>known</sub> w<sub>k</sub>
              <i>·</i> C = Σ<sub>known</sub> w<sub>k</sub> / Σ w<sub>k</sub>
            </span>
            <span className="pv-eq-note">
              Mars weights: geology {DEFAULT_WEIGHTS.jezero.geology}, terrain{" "}
              {DEFAULT_WEIGHTS.jezero.terrain}, aridity {DEFAULT_WEIGHTS.jezero.aridity}, temperature{" "}
              {DEFAULT_WEIGHTS.jezero.temperature} · unknown stays unknown
            </span>
          </div>
          <div className="pv-eq key">
            <span className="pv-eq-name">Priority</span>
            <span className="pv-math">
              P = (αF + (1 − α)U) · C<sup>γ</sup>
            </span>
            <span className="pv-eq-note">
              α = {DEFAULT_ALPHA.jezero} Mars, {DEFAULT_ALPHA["mare-crisium"]} Moon · only when C ≥ 0.7
              and geology is assessed
            </span>
          </div>
          <div className="pv-physics">
            <span>
              <b>Froude</b> v<sub>planet</sub> = v<sub>Earth</sub>√(g<sub>planet</sub>/g<sub>Earth</sub>)
            </span>
            <span>
              <b>Shao–Lu</b> u*<sub>t</sub> = √(A<sub>N</sub>(ρ<sub>p</sub>gd/ρ + γ/ρd))
            </span>
            <span>
              <b>SHA-256</b> every input pinned
            </span>
          </div>
        </div>
      ),
    },
    {
      tag: "What you can do",
      title: "One workflow, eight working tools.",
      visual: (
        <div className="pv-features">
          {(
            [
              [MapIcon, "Discovery atlas", "Map, globe and 3D terrain"],
              [Dna, "Analog DNA", "Why a site matches, and why not"],
              [SlidersHorizontal, "What-if & lenses", "Re-weight and test rank robustness"],
              [Globe2, "130-cell search", "Every cell, ranked per mission"],
              [Moon, "Lunar pole", "LOLA, Diviner, SPICE"],
              [FlaskConical, "Research Lab", "Minerals to dust, 8 tools"],
              [Box, "Field Study Builder", "Stations, GPX, field book, QR"],
              [ShieldCheck, "Reproducible", "Pinned releases, works offline"],
            ] as const
          ).map(([Icon, a, b], n) => (
            <div key={a} style={{ animationDelay: `${0.06 * n}s` }}>
              <Icon size={22} aria-hidden="true" />
              <b>{a}</b>
              <span>{b}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      tag: "The search",
      title: (
        <>
          <span className="mono">{total}</span> cells → <span className="mono">{picks || "—"}</span> mission picks
        </>
      ),
      visual: (
        <div className="pv-funnel">
          <div className="pv-dots" aria-hidden="true">
            {Array.from({ length: total }, (_, n) => (
              <span
                key={n}
                className={n < picks ? "pick" : n < eligible ? "ok" : ""}
                style={{ animationDelay: `${n * 6}ms` }}
              />
            ))}
          </div>
          <ul className="pv-legend">
            <li><span /> {total} screened with NASA POWER</li>
            <li className="ok"><span /> {eligible} rankable for Mars · Jezero</li>
            <li className="pick"><span /> {picks} mission-aware picks</li>
          </ul>
        </div>
      ),
      foot: mars
        ? `${mars.new_vs_release.length} of ${picks} picks were not on the dryness-only shortlist.`
        : undefined,
    },
    {
      tag: "Moon base",
      title: "Each Artemis-region feature, matched to Earth relief.",
      visual: (
        <ul className="pv-twins">
          {twins.map((s, n) => (
            <li key={s.id} style={{ animationDelay: `${0.12 * n}s` }}>
              <b>{s.feature}</b>
              <span className="pv-link">
                <span style={{ width: `${s.earth_twins![0].F}%` }} />
              </span>
              <span className="pv-twin">{twinName(s.earth_twins![0].id, s.earth_twins![0].name)}</span>
              <span className="mono">F {s.earth_twins![0].F.toFixed(0)}</span>
            </li>
          ))}
        </ul>
      ),
      foot: "LOLA terrain, Diviner temperatures and SPICE sunlight at the lunar south pole.",
    },
    {
      tag: "Honest by design",
      title: "Measured. Modeled. Unknown.",
      visual: (
        <div className="pv-honest">
          <div className="measured">
            <span className="pv-big mono">{covered}</span>
            <span>challenge dimensions covered</span>
          </div>
          <div className="modeled">
            <span className="pv-big mono">{bounded}</span>
            <span>open questions with a working tool</span>
          </div>
          <div className="unknown">
            <span className="pv-big mono">{(GRAVITY.mars / GRAVITY.earth).toFixed(2)}×</span>
            <span>Mars gravity. Earth can't fake it, so we say so.</span>
          </div>
        </div>
      ),
    },
    {
      tag: "Why it matters",
      title: "Built so others can push exploration further.",
      visual: (
        <div className="pv-impact">
          {(
            [
              [Rocket, "Mission teams", "Find and justify rehearsal sites"],
              [FlaskConical, "Field scientists", "Leave with a ready protocol"],
              [GraduationCap, "Students", "Learn what makes Mars, Mars"],
              [ShieldCheck, "Open science", "Every result reproducible, every gap a question"],
            ] as const
          ).map(([Icon, who, what], n) => (
            <div key={who} style={{ animationDelay: `${0.1 * n}s` }}>
              <Icon size={26} aria-hidden="true" />
              <b>{who}</b>
              <span>{what}</span>
            </div>
          ))}
        </div>
      ),
      foot: "Open NASA data in, testable science out.",
    },
    {
      tag: "Try it",
      title: (
        <>
          Earth is our first
          <br /> planetary laboratory.
        </>
      ),
      visual: (
        <div className="pv-end">
          <img src="/brand/terrainx-mark.svg" width="120" height="109" alt="TerrainX" />
          <QrCode value={appUrl} size={180} label="Open TerrainX" />
        </div>
      ),
      foot: "TerrainX · open NASA data · independent project, no NASA endorsement implied",
    },
  ];
  const last = slides.length - 1;
  const go = useCallback((n: number) => setI(Math.max(0, Math.min(last, n))), [last]);
  const exit = useCallback(() => navigate("/"), [navigate]);
  useEffect(() => {
    root.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(last);
      else if (e.key === "Escape") exit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, last, exit]);
  const s = slides[i];
  return (
    <div
      ref={root}
      tabIndex={-1}
      className="pitch"
      role="dialog"
      aria-modal="true"
      aria-label="TerrainX pitch"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button,a")) return;
        go(i + 1);
      }}
    >
      <div className="pitch-progress" style={{ width: `${((i + 1) / slides.length) * 100}%` }} />
      <header className="pitch-top">
        <span className="pitch-brand">
          <img src="/brand/terrainx-mark.svg" width="26" height="24" alt="" /> TerrainX
        </span>
        <span className="mono pitch-count">
          {i + 1} / {slides.length}
        </span>
        <button className="pitch-exit" onClick={exit} aria-label="Exit pitch">
          <X size={16} />
        </button>
      </header>
      <section key={i} className="pitch-slide" aria-live="polite">
        <p className="pitch-tag">{s.tag}</p>
        <h1>{s.title}</h1>
        <div className="pitch-visual">{s.visual}</div>
        {s.foot && <p className="pitch-foot">{s.foot}</p>}
      </section>
      <nav className="pitch-nav" aria-label="Slides">
        <button onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous slide">
          <ArrowLeft size={16} />
        </button>
        <div className="pitch-dots">
          {slides.map((x, n) => (
            <button
              key={x.tag}
              className={n === i ? "active" : ""}
              aria-label={x.tag}
              aria-current={n === i}
              onClick={() => go(n)}
            />
          ))}
        </div>
        <button onClick={() => go(i + 1)} disabled={i === last} aria-label="Next slide">
          <ArrowRight size={16} />
        </button>
      </nav>
    </div>
  );
}
