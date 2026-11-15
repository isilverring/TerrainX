import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Globe from "../components/Globe";
import { useData } from "../lib/data";
import BeyondKnown from "../components/BeyondKnown";
import FindingsStrip from "../components/FindingsStrip";
import ChallengeShowcase from "../components/ChallengeShowcase";
export default function Landing() {
  const { summary } = useData();
  const stats: [number, string][] = [
    [summary.screened_cells, "NASA POWER cells screened"],
    [summary.shortlisted_candidates, "algorithmic candidates"],
    [summary.characterized_candidates, "preliminary characterized"],
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
          <div className="hero-actions">
            <Link className="button primary launch" to="/explorer?cohort=original&polar=none">
              Launch Discovery Engine
              <ArrowRight size={24} />
            </Link>
            <Link
              className="button outline judge-entry"
              to="/guide?cohort=expanded&polar=none"
            >
              Start the five-step judge path
            </Link>
          </div>
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
            <span>
              NASA POWER / SRTM / MOLA / LOLA / Diviner / SPICE / GIBS · ESA
              Copernicus DEM
            </span>
          </div>
        </div>
        <Globe />
      </section>
      <section className="process-band" aria-label="How TerrainX works">
        {[
          ["Discover", "Search real Earth observations", "/explorer"],
          [
            "Compare",
            "Separate fidelity, utility and evidence — then re-rank through six lenses",
            "/lenses",
          ],
          ["Explain", "Understand where the analogy fails", "/frontier"],
          [
            "Prepare",
            "Design a testable field experiment, stations and field book",
            "/field-study",
          ],
        ].map(([title, description, to], i) => (
          <Link key={title} to={to} className="process-step">
            <h2>
              <span>0{i + 1}</span>
              {title}
            </h2>
            <p>{description}</p>
            <ArrowRight
              size={16}
              className="process-arrow"
              aria-hidden="true"
            />
          </Link>
        ))}
      </section>
      <FindingsStrip />
      <ChallengeShowcase />
      <BeyondKnown />
      <section className="research-entry">
        <div>
          <p className="document-label">Evidence before interpretation</p>
          <h2>Three candidates. Three different scientific decisions.</h2>
          <p>
            Follow a preliminary field question, an unsupported material
            interpretation and a documented benchmark.
          </p>
        </div>
        <Link className="button primary" to="/cases">
          Explore the case studies <ArrowRight size={18} />
        </Link>
      </section>
      <footer className="landing-footer">
        <strong>2026 NASA Space Apps Challenge</strong>
        <span>
          Earth Science · Planets & Moons · Software · Space Exploration
        </span>
        <small>
          Independent project. NASA data use does not imply endorsement.{" "}
          <Link to="/challenge">How TerrainX meets the challenge →</Link>
        </small>
      </footer>
    </main>
  );
}
