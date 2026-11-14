import { defaultScenario } from "./counterfactual";
import { validScenario } from "./scoring";
export function presentationDefaults() {
  return {
    jezero: defaultScenario("jezero"),
    "mare-crisium": defaultScenario("mare-crisium"),
  };
}
export function initialPresentation() {
  const p = new URLSearchParams(window.location.hash.split("?")[1]);
  return (
    window.location.hash.split("?")[0] === "#/demo" ||
    p.get("presentation") === "1"
  );
}
export function initialPresentationModels() {
  const all = presentationDefaults();
  try {
    const p = new URLSearchParams(window.location.hash.split("?")[1]),
      s = JSON.parse(p.get("model") ?? "null"),
      m = p.get("mission") === "mare-crisium" ? "mare-crisium" : "jezero";
    if (initialPresentation() && validScenario(s)) all[m] = s;
  } catch {}
  return all;
}
