import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Globe from "../components/Globe";
import { useData } from "../lib/data";
import BeyondKnown from "../components/BeyondKnown";
export default function Landing() {
  const { summary } = useData();
  const stats: [number, string][] = [
    [summary.screened_cells, "NASA POWER cells screened"],
    [summary.shortlisted_candidates, "algorithmic candidates"],
    [summary.characterized_candidates, "characterized"],
    [summary.benchmark_sites, "benchmarks, never counted"],
  ];
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="hero-copy">
          <h1>
            EARTH IS OUR
            <br />
            FIRST PLANETARY
            <br />
            LABORATORY.
          </h1>
          <p>
            Discover where to rehearse the science,
            <br className="desktop-break" /> technology and operations of
            another world.
          </p>
          <Link className="button primary launch" to="/explorer">
            Launch Discovery Engine
            <ArrowRight size={24} />
          </Link>
          <dl className="hero-stats" aria-label="Current dataset">
            {stats.map(([value, label]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="mono">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="powered">
            Powered by open NASA science data
            <span>NASA POWER / SRTM / MOLA / LOLA</span>
          </div>
        </div>
        <Globe />
      </section>
      <section className="process-band" aria-label="How TerrainX works">
        {[
          ["Discover", "Search real Earth observations"],
          ["Compare", "Separate fidelity, utility and evidence"],
          ["Explain", "Understand where the analogy fails"],
          ["Prepare", "Design a testable field experiment"],
        ].map(([title, description], i) => (
          <div key={title}>
            <h2>
              <span>0{i + 1}</span>
              {title}
            </h2>
            <p>{description}</p>
          </div>
        ))}
      </section>
      <BeyondKnown />
      <footer className="landing-footer">
        <strong>2026 NASA Space Apps Challenge</strong>
        <span>
          Earth Science · Planets & Moons · Software · Space Exploration
        </span>
        <small>
          Independent project. NASA data use does not imply endorsement.
        </small>
      </footer>
    </main>
  );
}
