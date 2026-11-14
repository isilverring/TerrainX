import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { DataContext, useData } from "../lib/data";
import { applyScenarios, useModel } from "../lib/scoring";
import { useScienceFile } from "../lib/scienceFile";
import { expandedCollection, fieldSitesSchema, type Collection } from "../lib/collections";

export default function CollectionScope({children}:{children:ReactNode}) {
  const base=useData(),model=useModel(),location=useLocation(),[params,setParams]=useSearchParams();
  const [retained,setRetained]=useState<Collection>(()=>params.get("cohort")==="expanded"?"expanded":"original");
  const [retainedMission,setRetainedMission]=useState<"jezero"|"mare-crisium">(()=>params.get("mission")==="mare-crisium"?"mare-crisium":"jezero");
  const mission=params.get("mission")==="mare-crisium"?"mare-crisium":params.get("mission")==="jezero"?"jezero":retainedMission;
  useLayoutEffect(()=>{if(params.has("mission"))setRetainedMission(mission);},[mission,params]);
  const collection:Collection=params.get("cohort")==="expanded"?"expanded":params.get("cohort")==="original"?"original":retained;
  useLayoutEffect(()=>{if(params.has("cohort"))setRetained(params.get("cohort")==="expanded"?"expanded":"original");},[params]);
  const {value,error}=useScienceFile("field_candidates.json",fieldSitesSchema,"Expanded search is absent from this historical release. No newer observations were substituted.",collection==="expanded");
  const data=useMemo(()=>({...((collection==="expanded"&&value)?applyScenarios(expandedCollection(base,value.candidates),model.scenarios):base),collection,active_mission:mission}),[base,value,collection,mission,model.scenarios]);
  // Route links may omit cohort; keep it explicitly in the URL before rendering
  // a dossier, so browser refresh, copied addresses and navigation agree.
  const show=!['/','/demo','/guide'].includes(location.pathname);
  return <DataContext.Provider value={data}><div className="collection-shell">
    {show&&<section className="collection-banner" aria-label="Scientific collection">
      <label>Study collection <select aria-label="Study collection" value={collection} onChange={e=>{const next=e.target.value as Collection;setRetained(next);const p=new URLSearchParams(params);p.set("cohort",next);setParams(p);}}>
        <option value="original">Original study · 16 candidates + 4 benchmarks</option>
        <option value="expanded">Expanded search · 130 cells + 4 benchmarks</option>
      </select></label><span>{collection==="original"?"Frozen baseline shortlist. Expanded cells remain a separate study.":"All screened-cell profiles; regional geology and coarse terrain remain preliminary."}</span>
    </section>}
    {collection==="expanded"&&!value?<main className="document-page"><h1>{error?"Requested collection unavailable":"Validating expanded observations…"}</h1>{error&&<p role="alert">{error}</p>}</main>:children}
  </div></DataContext.Provider>;
}
