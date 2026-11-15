import { Link, useSearchParams } from "react-router-dom";
import { FlaskConical } from "lucide-react";
import { LAB_MODULES } from "../lib/researchLab";
import { LAB_PROTOCOLS } from "../lib/labProtocols";
import { studyPath } from "../lib/collections";
import { useData } from "../lib/data";
import type { Mission } from "../lib/models";

/**
 * The challenge questions a screening dossier cannot answer, each with its Research Lab
 * tool and a field protocol. On paper it prints as a checklist of field work still to do.
 */
export default function OpenQuestions({
  id,
  mission,
}: {
  id: string;
  mission: Mission;
}) {
  const [params] = useSearchParams(),
    data = useData(),
    hasLab = !!data.release?.files["challenge_evidence.json"];
  return (
    <section className="science-section open-questions" aria-labelledby="oq-title">
      <h2 id="oq-title">
        <FlaskConical size={18} aria-hidden="true" /> What this dossier cannot answer yet
      </h2>
      <p>
        Screening scores never stand in for these measurements. Each question has a bounded
        Research Lab tool and a field protocol you can carry into the Field Study Builder.
        {!hasLab &&
          " This pinned release predates the Research Lab, so its tools show what is unavailable rather than substituting newer evidence."}
      </p>
      <ol>
        {LAB_MODULES.map((m) => (
          <li key={m.id}>
            <span className="oq-q">
              <strong>{m.title}</strong> {m.question}
            </span>
            <span className="oq-closes">{LAB_PROTOCOLS[m.id].closes}</span>
            <span className="oq-links">
              <Link
                to={studyPath(
                  `/research-lab?module=${m.id}&id=${id}${m.id === "base" ? "&mission=mare-crisium" : ""}`,
                  params.toString(),
                )}
              >
                Lab
              </Link>
              <Link
                to={studyPath(
                  `/field-study?id=${id}&mission=${m.id === "base" ? "mare-crisium" : mission}&lab=${m.id}`,
                  params.toString(),
                )}
              >
                Protocol
              </Link>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
