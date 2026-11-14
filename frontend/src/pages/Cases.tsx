import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useData } from "../lib/data";
import { fetchScienceJson, currentRelease } from "../lib/release";
import { BackLink, ScoreStrip, SourceLink } from "../components/ui";
const caseSchema = z.object({
  schema_version: z.literal("1.0"),
  reviewed_at: z.string(),
  cases: z.array(
    z.object({
      id: z.string(),
      candidate_id: z.string(),
      mission: z.enum(["jezero", "mare-crisium"]),
      role: z.string(),
      title: z.string(),
      supported: z.string(),
      scope: z.string(),
      contradiction: z.string(),
      independence: z.string(),
      next_measurement: z.string(),
      hypothesis: z.string(),
      sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
    }),
  ),
});
export default function Cases() {
  const data = useData(),
    [cases, setCases] = useState<z.infer<typeof caseSchema> | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!currentRelease()?.files["case_studies.json"]) {
      setError("Case studies were not included in this historical release.");
      return;
    }
    fetchScienceJson("case_studies.json")
      .then((x) => setCases(caseSchema.parse(x)))
      .catch((e) => setError(String(e)));
  }, [data.release?.release_id]);
  return (
    <main className="document-page cases-page">
      <BackLink mission="jezero" />
      <header className="document-title">
        <div>
          <p className="document-label">
            Three scientific decisions · source-scoped research
          </p>
          <h1>From screening to a field question</h1>
          <p>
            A supported hypothesis, a contradictory material interpretation, and
            a documented benchmark. Scores reflect your active model.
          </p>
        </div>
      </header>
      {error ? <p role="status">{error}</p> : null}
      {cases?.cases.map((item) => {
        const c = data.candidates.find((c) => c.id === item.candidate_id);
        if (!c) return null;
        return (
          <article
            className="science-section case-study"
            id={item.id}
            key={item.id}
          >
            <p className="document-label">{item.role}</p>
            <h2>{item.title}</h2>
            <h3>{c.name}</h3>
            <ScoreStrip assessment={c.assessments[item.mission]} />
            <div className="case-claims">
              {[
                ["What supports the question", item.supported],
                ["Where the evidence applies", item.scope],
                ["Contradictions and limits", item.contradiction],
                ["Evidence independence", item.independence],
                ["What to measure next", item.next_measurement],
                [
                  "Proposed hypothesis — no experiment conducted",
                  item.hypothesis,
                ],
              ].map(([label, text]) => (
                <section key={label}>
                  <h3>{label}</h3>
                  <p>{text}</p>
                </section>
              ))}
            </div>
            <div className="reference-list">
              {item.sources.map((s) => (
                <SourceLink url={s.url} key={s.url}>
                  {s.title}
                </SourceLink>
              ))}
            </div>
            <div className="source-row">
              <Link
                className="button primary"
                to={`/site/${c.id}?mission=${item.mission}`}
              >
                Inspect this candidate
              </Link>
              <Link
                className="button outline"
                to={`/research?id=${c.id}&mission=${item.mission}`}
              >
                Save a research study
              </Link>
            </div>
          </article>
        );
      })}
    </main>
  );
}
