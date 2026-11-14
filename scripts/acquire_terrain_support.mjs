import {fileURLToPath} from 'node:url';
// Public Copernicus GLO-90 2021 source acquisition. No tracked file is modified.
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'outputs/m5-assets'),source=path.join(root,'data/source/pilot');
await mkdir(out,{recursive:true});
const read=async f=>JSON.parse(await readFile(path.join(root,f),'utf8'));
const original=await read('data/source/pilot/manifest.json');
const cells=await read('data/derived/cell_search.json'),field=await read('data/derived/field_candidates.json'),dataset=await read('frontend/public/data/dataset.json');
const candidates=new Map([...field.candidates,...dataset.candidates].map(c=>[c.id,c]));
const ids=[...new Set([...Object.values(cells.missions).flatMap(m=>m.shortlist),...dataset.candidates.filter(c=>c.benchmark).map(c=>c.id)])].sort();
const RAD=Math.PI/180,R=6371000,HALF=25000;
function offset(lat,lon,east,north){const d=Math.hypot(east,north),a=d/R,b=Math.atan2(east,north),p=lat*RAD;const t=Math.asin(Math.sin(p)*Math.cos(a)+Math.cos(p)*Math.sin(a)*Math.cos(b));return[t/RAD,lon+Math.atan2(Math.sin(b)*Math.sin(a)*Math.cos(p),Math.cos(a)-Math.sin(p)*Math.sin(t))/RAD];}
function tile(n,e){return `${n>=0?'N':'S'}${String(Math.abs(n)).padStart(2,'0')}_00_${e>=0?'E':'W'}${String(Math.abs(e)).padStart(3,'0')}_00`;}
const pilots=ids.map(id=>{const c=candidates.get(id);if(!c)throw Error('Absent candidate '+id);const boundary=[];for(let i=-25;i<=25;i++){for(const [x,y]of[[i*1000,-HALF],[i*1000,HALF],[-HALF,i*1000],[HALF,i*1000]])boundary.push(offset(c.latitude,c.longitude,x,y));}const minLat=Math.min(...boundary.map(p=>p[0]))-.001,maxLat=Math.max(...boundary.map(p=>p[0]))+.001,minLon=Math.min(...boundary.map(p=>p[1]))-.001,maxLon=Math.max(...boundary.map(p=>p[1]))+.001;const tiles=[];for(let n=Math.floor(minLat);n<=Math.floor(maxLat);n++)for(let e=Math.floor(minLon);e<=Math.floor(maxLon);e++)tiles.push(tile(n,e));return{id,name:c.name,latitude:c.latitude,longitude:c.longitude,benchmark:c.benchmark,selection:Object.entries(cells.missions).filter(([,m])=>m.shortlist.includes(id)).map(([k])=>k),tile_ids:tiles,requested_bounds:[minLon,minLat,maxLon,maxLat],input_half_extent_m:24000,tile_selection_half_extent_m:HALF};});
const tiles=[...new Set(pilots.flatMap(p=>p.tile_ids))].sort();
const old=new Map(original.assets.map(a=>[a.url,a]));
const jobs=[];
for(const id of tiles){const folder=`Copernicus_DSM_COG_30_${id}_DEM`,base=`https://copernicus-dem-90m.s3.amazonaws.com/${folder}`;for(const kind of ['DEM','EDM','FLM','WBM','metadata','licence']){const name=kind==='metadata'?`Copernicus_DSM_30_${id}.xml`:kind==='licence'?'eula_F.pdf':`Copernicus_DSM_COG_30_${id}_${kind}.tif`;const sub=['EDM','FLM','WBM'].includes(kind)?'AUXFILES/':kind==='licence'?'INFO/':'';jobs.push({tile_id:id,kind,url:`${base}/${sub}${name}`,relative_path:`${id}/${name}`});}}
await writeFile(path.join(out,'selection.json'),JSON.stringify({ids,pilots,tiles,jobs:jobs.length},null,2)+'\n');
const assets=[],errors=[],failures=[];let done=0,index=0;
function sha(b){return createHash('sha256').update(b).digest('hex');}
async function ranged(url){
 const h=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(20000)});
 if(!h.ok)return {response:h,body:Buffer.alloc(0)};
 const size=Number(h.headers.get('content-length'));if(!Number.isSafeInteger(size)||size<=0)throw Error('Invalid source length');
 const chunk=512*1024,parts=new Array(Math.ceil(size/chunk));let next=0;
 const dir=path.join(out,'ranges',createHash('sha256').update(url+'|'+h.headers.get('etag')).digest('hex').slice(0,20));await mkdir(dir,{recursive:true});
 await Promise.all(Array.from({length:2},async()=>{while(next<parts.length){const i=next++,start=i*chunk,end=Math.min(size-1,start+chunk-1),file=path.join(dir,String(i)+'.part');try{const b=await readFile(file);if(b.length===end-start+1){parts[i]=b;continue;}}catch{}
 const r=await fetch(url,{headers:{Range:`bytes=${start}-${end}`},signal:AbortSignal.timeout(25000)});if(r.status!==206||r.headers.get('content-range')!==`bytes ${start}-${end}/${size}`||r.headers.get('etag')!==h.headers.get('etag'))throw Error('Range/status/ETag validation failed');const b=Buffer.from(await r.arrayBuffer());if(b.length!==end-start+1)throw Error('Truncated range');await writeFile(file,b);parts[i]=b;}}));
 const body=Buffer.concat(parts);if(body.length!==size)throw Error('Incomplete reconstructed object');
 const etag=h.headers.get('etag')?.replaceAll('"','');if(/^[a-f0-9]{32}$/.test(etag??'')&&createHash('md5').update(body).digest('hex')!==etag)throw Error('S3 single-part MD5/ETag mismatch');
 return {response:h,body};
}
async function job(j){const existing=old.get(j.url);if(existing){const f=path.join(source,existing.relative_path);try{const b=await readFile(f);if(b.length===existing.bytes&&sha(b)===existing.sha256){assets.push(existing);return;}}catch{}}
 const destination=path.join(out,'cache',j.relative_path),receipt=destination+'.receipt.json';await mkdir(path.dirname(destination),{recursive:true});
 try{const r=JSON.parse(await readFile(receipt,'utf8')),b=await readFile(destination);if(b.length===r.bytes&&sha(b)===r.sha256){assets.push(r);return;}}catch{}
 let last;
 for(let attempt=0;attempt<3;attempt++){try{let r,b;if(j.kind==='DEM'){const result=await ranged(j.url);r=result.response;b=result.body;}else{r=await fetch(j.url,{signal:AbortSignal.timeout(25000)});b=Buffer.from(await r.arrayBuffer());}if(!r.ok){if(r.status===404){failures.push({...j,http_status:404,reason:'Source object absent; no replacement raster generated.'});return;}throw Error(`HTTP ${r.status}`);}if(!b.length)throw Error('Empty response');await writeFile(destination,b);const record={...j,retrieved_at:new Date().toISOString(),http_status:r.status,response_content_type:r.headers.get('content-type'),bytes:b.length,sha256:sha(b),etag:r.headers.get('etag'),last_modified:r.headers.get('last-modified'),resolved_url:r.url,...(j.kind==='DEM'?{acquisition_method:'Validated512KiB HTTP ranges with exact Content-Range/length/ETag; reconstructed bytes match S3 single-part MD5 ETag.'}:{})};await writeFile(receipt,JSON.stringify(record,null,2)+'\n');assets.push(record);return;}catch(e){last=String(e);if(attempt<2)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
 errors.push({...j,error:last});}
console.log(JSON.stringify({selected_sites:ids.length,tiles:tiles.length,requests:jobs.length}));
await Promise.all(Array.from({length:6},async()=>{while(index<jobs.length){const j=jobs[index++];await job(j);done++;if(done%12===0||done===jobs.length)console.log(JSON.stringify({done,total:jobs.length,successful:assets.length,absent:failures.length,errors:errors.length}));}}));
for(const a of original.assets.filter(a=>a.tile_id===null))assets.push(a);
assets.sort((a,b)=>a.relative_path.localeCompare(b.relative_path));
const result={...original,created_at:new Date().toISOString(),complete:!errors.length&&!failures.length,pilots,assets,completed_at:new Date().toISOString(),total_bytes:assets.reduce((s,a)=>s+a.bytes,0),selection:{source:'terrainx-cell-search-v3 mission-aware shortlists + four original benchmarks',source_file:'data/derived/cell_search.json',source_sha256:sha(await readFile(path.join(root,'data/derived/cell_search.json'))),original_pilot_manifest_sha256:sha(await readFile(path.join(source,'manifest.json'))),requested_sites:ids.length,requested_tiles:tiles.length,tile_selection:'Boundary sampled at1km intervals around25km half-extent spherical azimuthal-equidistant square; extra0.001degree geographic guard; analysis input half-extent24km.'},acquisition_errors:errors,absent_objects:failures};
await writeFile(path.join(out,'manifest.proposed.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({complete:result.complete,sites:ids.length,tiles:tiles.length,assets:assets.length,total_bytes:result.total_bytes,absent:failures.length,errors:errors.length,manifest:path.join(out,'manifest.proposed.json')}));
