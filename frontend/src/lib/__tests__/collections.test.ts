import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {realDataset} from "./fixtures";
import {expandedCollection,fieldSitesSchema,studyPath} from "../collections";
import {makeSnapshot,snapshotLink} from "../snapshots";
import {defaultScenario} from "../counterfactual";
import {releaseSchema} from "../release";
import {lunarPolarSchema} from "../lunarPolar";
import {polarReference} from "../polarReference";
import {applyScenarios} from "../scoring";
import {buildPacket} from "../packet";
import {pilotSchema} from "../pilot";
import {siteEvidenceSchema} from "../siteEvidence";
describe("explicit scientific collections",()=>{
 it("retains scoped literature positions independently from candidate measurements",()=>{
  const evidence=siteEvidenceSchema.parse(JSON.parse(readFileSync(resolve(__dirname,"../../../public/data/site_evidence.json"),"utf8")));
  expect(evidence.cases).toHaveLength(2);expect(evidence.cases[0].reported_points[0].material).toBe("Basaltic-andesite lava");expect(evidence.cases[1].reported_points[0].derived_scope.within_approximate_analysis_window).toBe(false);
 });
 it("validates all36 source-support results and retains sensitivity scope",()=>{
  const study=pilotSchema.parse(JSON.parse(readFileSync(resolve(__dirname,"../../../public/data/terrain_support.json"),"utf8")));
  expect(study.results).toHaveLength(36);expect(study.sensitivity).toHaveLength(36);expect(study.sensitivity![0].rank_scope).toContain("F-only");
 });
 it("keeps real polar target identity and never imports Mare Crisium utility",()=>{
  const data=realDataset(),polar=lunarPolarSchema.parse(JSON.parse(readFileSync(resolve(__dirname,"../../../public/data/lunar_polar.json"),"utf8")));
  const scenario={jezero:defaultScenario("jezero"),"mare-crisium":defaultScenario("mare-crisium")};
  const referenced=applyScenarios(polarReference(data,polar,"haworth"),scenario);
  const c=referenced.candidates[0],assessment=c.assessments["mare-crisium"];
  expect(referenced.target_reference).toBe("lunar-polar:haworth");expect(assessment.utility.value).toBeNull();expect(assessment.utility.coverage).toBe(0);expect(assessment.priority).toBeNull();
  const packet=buildPacket(referenced,c,"mare-crisium");expect(packet.target.id).toBe("lunar-polar:haworth");expect(packet.target.name).toBe("Haworth");
  expect(()=>polarReference(data,polar,"missing")).toThrow(/unavailable/);
 });
 it("retains original objects and numeric results while exposing all130 cells",()=>{
  const base=realDataset(), before=JSON.stringify(base);
  const extra=fieldSitesSchema.parse(JSON.parse(readFileSync(resolve(__dirname,"../../../public/data/field_candidates.json"),"utf8")));
  const expanded=expandedCollection(base,extra.candidates);
  expect(expanded.candidates).toHaveLength(134);expect(expanded.candidates.find(c=>c.id==="chile--23.000--70.000")).toBeDefined();
  for(const original of base.candidates)expect(expanded.candidates.find(c=>c.id===original.id)).toBe(original);
  expect(JSON.stringify(base)).toBe(before);
 });
 it("carries explicit destination choices and pins collection in snapshot replay",()=>{
  expect(studyPath("/site/example?mission=jezero","?mission=mare-crisium&cohort=expanded&science=science-1234567890abcdef")).toContain("mission=jezero&science=science-1234567890abcdef&cohort=expanded");
  const release=releaseSchema.parse(JSON.parse(readFileSync(resolve(__dirname,"../../../public/data/release.json"),"utf8")));
  const data={...realDataset(),release,collection:"expanded" as const};
  const snapshot=makeSnapshot(data,{jezero:defaultScenario("jezero"),"mare-crisium":defaultScenario("mare-crisium")},"jezero",data.candidates[0].id,"Study");
  expect(snapshotLink(snapshot)).toContain("cohort=expanded");
 });
});
