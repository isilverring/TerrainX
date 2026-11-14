import { useModel } from "../lib/scoring";
import type { Weights } from "../lib/scoring";
import type { Mission } from "../lib/models";
export default function ModelControls({ mission }: { mission: Mission }) {
  const model = useModel();
  const labels: Record<keyof Weights, string> = {
    geology: "Geology",
    terrain: "Terrain",
    aridity: "Dryness",
    temperature: "Earth thermal context",
  };
  return (
    <details className="model-controls">
      <summary>Model assumptions</summary>
      <p>
        Experimental utility weights, not NASA limits. Adjusting one preserves a
        total of 1.00.
      </p>
      <p className="mono">
        Active α {model.scenarios[mission].alpha.toFixed(2)} · minimum C{" "}
        {(100 * model.scenarios[mission].minCoverage).toFixed(0)}%
      </p>
      <a href={`#/what-if?mission=${mission}`}>
        Edit fidelity tolerances and full model
      </a>
      {(Object.keys(labels) as (keyof Weights)[]).map((key) => (
        <label key={key} htmlFor={`weight-${key}`}>
          <span>
            {labels[key]}
            <b>{model.weights[mission][key].toFixed(2)}</b>
          </span>
          <input
            id={`weight-${key}`}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={model.weights[mission][key]}
            onChange={(e) => model.change(mission, key, Number(e.target.value))}
          />
        </label>
      ))}
      <button onClick={() => model.reset(mission)}>
        Reset mission defaults
      </button>
    </details>
  );
}
