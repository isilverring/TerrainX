// Production-only first-party catalogue. Third-party map tiles are deliberately excluded.
import {readdir, readFile, writeFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), dist=path.join(root,'frontend/dist');
const science=JSON.parse(await readFile(path.join(dist,'data/release.json'),'utf8'));
const build=JSON.parse(await readFile(path.join(dist,'build-info.json'),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
async function walk(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);files.push(...(entry.isDirectory()?await walk(f):[f]));}return files;}
const assets=[];
for(const file of (await walk(dist)).sort()){
  const name=path.relative(dist,file).replaceAll('\\','/');
  if(['sw.js','offline-index.json'].includes(name)||name.endsWith('.map'))continue;
  if(name.startsWith('releases/')&&!name.startsWith(`releases/${science.release_id}/`))continue;
  const body=await readFile(file);assets.push({url:`/${name}`,bytes:body.length,sha256:hash(body)});
}
const index={schema_version:1,build_id:hash(JSON.stringify(assets)).slice(0,20),application_commit:build.application_commit,science_release:science.release_id,assets};
await writeFile(path.join(dist,'offline-index.json'),JSON.stringify(index));
const template=await readFile(path.join(root,'scripts/offline-worker.js'),'utf8');
await writeFile(path.join(dist,'sw.js'),`const CATALOGUE=${JSON.stringify(index)};\n${template}`);
console.log(`Offline catalogue: ${assets.length} verified first-party files, ${(assets.reduce((s,a)=>s+a.bytes,0)/1048576).toFixed(1)} MiB`);
