import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {realDataset} from "./fixtures";
import {expandedCollection,fieldSitesSchema,studyPath} from "../collections";
import {makeSnapshot,snapshotLink} from "../snapshots";
import {defaultScenario} from "../counterfactual";
import {releaseSchema} from "../release";
describe("explicit scientific collections",()=>{
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
