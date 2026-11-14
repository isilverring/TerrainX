import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useData, number, coordinates } from "../lib/data";
import type { Candidate, Mission } from "../lib/models";
import { beyondKnown, explainScores } from "../lib/story";
import { MarsGlyph, MoonGlyph } from "./glyphs";

function Card({
  c,
  mission,
  kicker,
  kind,
  note,
}: {
  c: Candidate | null;
  mission: Mission;
  kicker: string;
  kind: string;
  note: string;
}) {
  if (!c)
    return (
      <div className={`beyond-card ${kind} empty`}>
        <span className="beyond-kicker">{kicker}</span>
        <p>{note}</p>
      </div>
    );
  const a = c.assessments[mission];
  return (
    <div className={`beyond-card ${kind}`}>
      <span className="beyond-kicker">{kicker}</span>
      <h3>{c.name}</h3>
      <p className="mono beyond-coord">{coordinates(c)}</p>
      <dl>
        <div>
          <dt>F</dt>
          <dd className="mono">{number(a.fidelity.value, 0)}</dd>
        </div>
        <div>
          <dt>U</dt>
          <dd className="mono">{number(a.utility.value, 0)}</dd>
        </div>
        <div>
          <dt>C</dt>
          <dd className="mono">{number(100 * a.utility.coverage, 0)}%</dd>
        </div>
        <div>
          <dt>P</dt>
          <dd className="mono">{number(a.priority, 1)}</dd>
        </div>
      </dl>
      <p className="beyond-note">{note}</p>
      <Link to={`/site/${c.id}?mission=${mission}`}>
        Analog DNA <ArrowUpRight size={12} />
      </Link>
    </div>
  );
}

export default function BeyondKnown() {
  const data = useData();
  const [mission, setMission] = useState<Mission>("jezero");
  const s = beyondKnown(data, mission);
  const target = data.targets.find((t) => t.id === mission)!;
  return (
    <section className="beyond" aria-labelledby="beyond-title">
      <div className="beyond-head">
        <div>
          <p className="document-label">
            <Sparkles size={14} /> Discovery story
          </p>
          <h2 id="beyond-title">Beyond the known analogs</h2>
          <p>
            Documented benchmarks, algorithmic candidates and raw screening
            cells are kept apart. Exploratory candidates are selected by NASA
            observations, not taken from the benchmark list.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Mission">
          <button
            className={mission === "jezero" ? "active" : ""}
            aria-pressed={mission === "jezero"}
            onClick={() => setMission("jezero")}
          >
            <MarsGlyph size={15} /> Mars · Jezero
          </button>
          <button
            className={mission === "mare-crisium" ? "active" : ""}
            aria-pressed={mission === "mare-crisium"}
            onClick={() => setMission("mare-crisium")}
          >
            <MoonGlyph size={15} /> Moon · Crisium
          </button>
        </div>
      </div>
      <div className="beyond-grid">
        <Card
          c={s.bestBenchmark}
          mission={mission}
          kind="benchmark"
          kicker="Best documented benchmark"
          note="Independently documented reference site. Never counted as a new discovery."
        />
        <Card
          c={s.bestExploratory}
          mission={mission}
          kind="exploratory"
          kicker="Best preliminary characterized exploratory candidate"
          note={
            s.bestExploratory
              ? "Selected algorithmically; enough evidence for a preliminary hypothesis. Requires field validation."
              : `No algorithmic candidate meets the evidence requirement for ${target.name}: geology is unknown for all of them. That honest negative result is kept.`
          }
        />
        <Card
          c={s.topScreening}
          mission={mission}
          kind="screening"
          kicker="Highest-ranked environmental screening cell"
          note="Driest shortlisted NASA POWER cell (lowest precipitation proxy). Dryness alone does not establish geology."
        />
      </div>
      {s.unexpected.length ? (
        <div className="unexpected">
          <h3>Unexpected within this screened sample</h3>
          {s.unexpected.map((c) => (
            <p key={c.id}>
              <strong>{c.name}</strong> — exploratory research candidate. P{" "}
              {number(c.assessments[mission].priority, 1)} meets or exceeds the
              lowest-scoring benchmark ({number(s.threshold, 1)};{" "}
              {s.benchmarks
                .map(
                  (b) =>
                    `${b.name} ${number(b.assessments[mission].priority, 1)}`,
                )
                .join(", ")}
              ). {explainScores(c, mission)} Not claimed as never studied, a
              first discovery or the best analog.
            </p>
          ))}
        </div>
      ) : (
        <div className="unexpected">
          <h3>Unexpected within this screened sample</h3>
          <p>
            None for {target.name} under the current model: no exploratory
            candidate reaches the lowest benchmark’s combined priority with
            sufficient evidence. See the Discovery Frontier for what to measure
            next.
          </p>
        </div>
      )}
      <Link className="beyond-more" to={`/frontier?mission=${mission}`}>
        Open the Discovery Frontier <ArrowUpRight size={13} />
      </Link>
    </section>
  );
}
