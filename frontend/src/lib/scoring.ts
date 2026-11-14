import { createContext, useContext } from 'react'
import type { Candidate, Dataset, Mission } from './models'
export type Weights = Record<'geology'|'terrain'|'aridity'|'temperature',number>
export const defaultWeights:Record<Mission,Weights>={jezero:{geology:.55,terrain:.20,aridity:.15,temperature:.10},'mare-crisium':{geology:.55,terrain:.30,aridity:.10,temperature:.05}}
export function validWeights(weights:unknown):weights is Weights {
 if(!weights||typeof weights!=='object')return false
 const w=weights as Weights
 return ['geology','terrain','aridity','temperature'].every(k=>Number.isFinite(w[k as keyof Weights])&&w[k as keyof Weights]>=0)&&Math.abs(Object.values(w).reduce((s,v)=>s+v,0)-1)<1e-6
}
export function rebalanceWeight(weights:Weights,key:keyof Weights,value:number):Weights {
 const next={...weights,[key]:Math.min(1,Math.max(0,value))},otherTotal=1-weights[key]
 for(const criterion of Object.keys(weights) as (keyof Weights)[])if(criterion!==key)next[criterion]=otherTotal>1e-9?weights[criterion]*(1-next[key])/otherTotal:(1-next[key])/3
 return next
}
export function applyWeights(data:Dataset,weights:Record<Mission,Weights>):Dataset {
 const candidates=data.candidates.map(candidate=>{
  const c:Candidate={...candidate,assessments:{...candidate.assessments}}
  for(const mission of ['jezero','mare-crisium'] as Mission[]){
   const original=candidate.assessments[mission],criteria=original.utility.criteria,w=weights[mission]
   let assessed=0,total=0
   for(const key of Object.keys(w) as (keyof Weights)[]){const v=criteria[key].value;if(v!==null){assessed+=w[key];total+=v*w[key]}}
   const value=assessed>0?100*total/assessed:null,geo=criteria.geology.value
   const status=c.benchmark?'REFERENCE ANALOG':assessed>=.7&&geo!==null&&geo>=.5?'CHARACTERIZED CANDIDATE':'SCREENED CANDIDATE'
   const utility={...original.utility,weights:w,value,coverage:assessed,status,evidence_label:assessed>=.7&&geo!==null?'Sufficient for preliminary hypothesis':'Insufficient evidence'}
   c.assessments[mission]={...original,utility,priority:original.fidelity.value!==null&&value!==null&&assessed>=.7&&geo!==null?(original.alpha*original.fidelity.value+(1-original.alpha)*value)*assessed**original.gamma:null,experiment:{...original.experiment,evidence_gate:geo!==null&&assessed>=.7?'Preliminary test hypothesis':'Verification-first proposal; insufficient geological evidence'}}
  }
  c.status=c.benchmark?'REFERENCE ANALOG':Object.values(c.assessments).some(a=>a.utility.status==='CHARACTERIZED CANDIDATE')?'CHARACTERIZED CANDIDATE':'SCREENED CANDIDATE'
  return c
 })
 return {...data,candidates,summary:{...data.summary,characterized_candidates:candidates.filter(c=>c.status==='CHARACTERIZED CANDIDATE').length}}
}
export const ModelContext=createContext<{weights:Record<Mission,Weights>;change:(mission:Mission,key:keyof Weights,value:number)=>void;reset:(mission:Mission)=>void}>({weights:defaultWeights,change:()=>{},reset:()=>{}})
export function useModel(){return useContext(ModelContext)}
export function storedWeights(){try{const saved=JSON.parse(localStorage.getItem('terrainx-weights-v1')??'null');if(saved&&validWeights(saved.jezero)&&validWeights(saved['mare-crisium']))return saved as Record<Mission,Weights>}catch{/* Invalid or unavailable storage uses documented defaults. */}return defaultWeights}
