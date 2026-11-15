import { Link } from "react-router-dom";
import {
  ArrowRight,
  Droplets,
  Gem,
  Microscope,
  Mountain,
  Route,
  Sun,
  Tent,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useData } from "../lib/data";
import { LAB_MODULES, type LabModule } from "../lib/researchLab";
import { LAB_PROTOCOLS } from "../lib/labProtocols";

const ICONS: Record<LabModule, LucideIcon> = {
  mineralogy: Gem,
  illumination: Sun,
  resources: Droplets,
  dust: Wind,
  biology: Microscope,
  caves: Mountain,
  operations: Route,
  base: Tent,
};

/** Landing-page answer to the Space Apps question: what each world gets. */
export function ChallengeAnswer() {
  const { summary } = useData();
  const worlds: { tag: string; title: string; body: string; to: string; cta: string; tone: string }[] = [
    {
      tone: "moon",
      tag: "Permanent Moon base",
      title: "Lunar south pole, measured at the feature centres",
      body: "LOLA terrain, Diviner thermal and ice-stability models, and SPICE solar geometry at eight IAU features near NASA's Artemis III candidate regions. Each feature is matched to its closest Earth relief twin.",
      to: "/lunar-pole",
      cta: "Explore the pole",
    },
    {
      tone: "mars",
      tag: "Mars · Jezero and Moon · Mare Crisium",
      title: `${summary.screened_cells} Earth cells ranked against real orbital terrain`,
      body: "Terrain fidelity from SRTM against MOLA and LOLA, mission utility from mapped geology and climate, and evidence coverage are scored separately and never mixed. Missing evidence stays empty.",
      to: "/explorer?cohort=original&polar=none",
      cta: "Open the Discovery Engine",
    },
    {
      tone: "earth",
      tag: "Earth, ready for fieldwork",
      title: "From a ranked cell to a field protocol",
      body: "Place stations on cached elevation samples, then export GPX, a printable field book and a QR share link. Every plan is pinned to the science release that produced it.",
      to: "/field-study",
      cta: "Plan a field study",
    },
  ];
  return (
      <section className="challenge-answer" aria-labelledby="ca-title">
        <header>
          <p className="document-label">2026 NASA Space Apps · the challenge</p>
          <h2 id="ca-title">
            Where on Earth can we rehearse a Moon base and a Mars mission?
          </h2>
          <p>
            The challenge asks for Earth locations analogous to permanent Moon-base sites and to
            Mars. TerrainX answers with measured terrain and climate, separate fidelity and
            utility scores, and a clear statement of what Earth cannot reproduce.
          </p>
        </header>
        <div className="world-cards">
          {worlds.map((w) => (
            <Link key={w.tag} to={w.to} className={`world-card ${w.tone}`}>
              <span className="world-orb" aria-hidden="true" />
              <p className="world-tag">{w.tag}</p>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
              <span className="world-cta">
                {w.cta} <ArrowRight size={15} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
  );
}

/** The eight Research Lab questions as a browsable grid. */
export function LabShowcase() {
  return (
      <section className="lab-showcase" aria-labelledby="ls-title">
        <header>
          <div>
            <p className="document-label">Research Lab · eight open questions</p>
            <h2 id="ls-title">Every gap the scores cannot close gets a working tool.</h2>
          </div>
          <p>
            Minerals, sunlight, ice, dust, life, caves, traverses and the base itself. Each tool
            separates what is measured from what is modeled and what is still unknown. It then
            writes a field protocol you can take to the site.
          </p>
        </header>
        <ol className="lab-tiles">
          {LAB_MODULES.map((m, i) => {
            const Icon = ICONS[m.id];
            return (
              <li key={m.id}>
                <Link to={`/research-lab?module=${m.id}`} className="lab-tile">
                  <span className="lab-tile-top">
                    <Icon size={20} aria-hidden="true" />
                    <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                  </span>
                  <strong>{m.title}</strong>
                  <span className="lab-tile-q">{m.question}</span>
                  <span className="lab-tile-dim">{LAB_PROTOCOLS[m.id].closes}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="evidence-legend" aria-label="Evidence classes">
          <span className="measured">Measured</span>
          <span className="modeled">Modeled</span>
          <span className="unknown">Still unknown</span>
          <Link to="/challenge">See how each challenge dimension is covered →</Link>
        </div>
      </section>
  );
}
