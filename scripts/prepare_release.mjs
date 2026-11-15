import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicDir=path.join(root,'frontend','public');
const filenames=['dataset.json','screened_cells.geojson','provenance.json','planetary_context.json','land.geojson','validation.json'];
for(const optional of ['case_studies.json','terrain_pilot.json','terrain_support.json','site_evidence.json','cell_search.json','lunar_polar.json','field_candidates.json','challenge_evidence.json','lunar_illumination.json','operations_terrain.json','climate_extremes.json']){try{await access(path.join(publicDir,'data',optional));filenames.push(optional);}catch{}}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const content=await Promise.all(filenames.map(async name=>{const target=path.join(publicDir,'data',name),raw=await readFile(target),body=Buffer.from(raw.toString('utf8').replace(/\r\n/g,'\n'));if(!raw.equals(body))await writeFile(target,body);return[name,body];}));
const files=Object.fromEntries(content.map(([name,body])=>[name,{sha256:sha(body),bytes:body.length}]));
const releaseId='science-'+sha(JSON.stringify(files)).slice(0,16);
const destination=path.join(publicDir,'releases',releaseId);
await mkdir(destination,{recursive:true});
let dataCommit='unavailable',appCommit='unavailable';
try { dataCommit=execFileSync('git',['log','-1','--format=%H','--','frontend/public/data/dataset.json'],{cwd:root,encoding:'utf8'}).trim(); appCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(); } catch {}
const manifest={schema_version:'1.0',release_id:releaseId,model_version:'terrainx-model-v1',dataset_sha256:files['dataset.json'].sha256,source_data_commit:dataCommit,files};
for(const [name,body] of content) {
 const target=path.join(destination,name);
 try {await access(target);if(sha(await readFile(target))!==files[name].sha256)throw new Error('Immutable science asset changed: '+target);}
 catch(error) {if(error.code==='ENOENT')await writeFile(target,body);else throw error;}
}
const manifestPath=path.join(destination,'manifest.json');
try {await access(manifestPath);const existing=JSON.parse(await readFile(manifestPath,'utf8'));if(existing.release_id!==releaseId||JSON.stringify(existing.files)!==JSON.stringify(files))throw new Error('Immutable release manifest mismatch');}
catch(error){if(error.code==='ENOENT')await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');else throw error;}
const frozen=await readFile(manifestPath);
await writeFile(path.join(publicDir,'data','release.json'),frozen);
await writeFile(path.join(publicDir,'build-info.json'),JSON.stringify({application_commit:appCommit,science_release:releaseId,built_at:new Date().toISOString(),ai_disclosure:'AI-assisted: OpenAI Codex and Anthropic Claude generated and edited large parts of the code, data-processing scripts, tests and documentation under team review. Observations are unchanged cited source data; no AI model creates or alters scientific values; no AI service is called at runtime. See AI_DISCLOSURE.md.'})+'\n');
console.log('Prepared immutable science release '+releaseId);
