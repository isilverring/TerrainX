import{describe,it,expect}from'vitest';
import{readFileSync}from'node:fs';
import{resolve}from'node:path';
import{candidateSchema}from'../models';
import{cellSearchSchema}from'../cellSearch';
import{lunarPolarSchema}from'../lunarPolar';
const read=(name:string)=>JSON.parse(readFileSync(resolve(__dirname,'../../../public/data',name),'utf8'));
describe('audited expanded scientific contracts',()=>{
 it('retains genuine units and hashes on the expanded cell measurements',()=>{
  const data=cellSearchSchema.parse(read('cell_search.json'));
  for(const r of data.rows){expect(r.environment?.units?.T2M_MIN).toBe('C');expect(r.climate_observations?.T2M.provenance.sha256).toHaveLength(64);}
 });
 it('validates all expanded field sites without borrowing other site measurements',()=>{
  const raw=read('field_candidates.json');const cells=read('cell_search.json');
  for(const row of raw.candidates){const c=candidateSchema.parse(row);const source=cells.rows.find((r:{id:string})=>r.id===c.id);expect(c.latitude).toBe(source.latitude);expect(c.climate.T2M?.value).toBe(source.climate.T2M);expect(c.terrain.elevations_m).toEqual(source.terrain.elevations_m);expect(c.benchmark).toBe(false);}
 });
 it('retains area-weighting and unknown ice codes in the polar product',()=>{
  const p=lunarPolarSchema.parse(read('lunar_polar.json'));
  for(const s of p.sites)if(s.diviner){expect(s.diviner.fraction_basis).toContain('triangle surface area');expect(s.diviner.ice_undocumented_code_fraction).toBeGreaterThanOrEqual(0);}
 });
});
