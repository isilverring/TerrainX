/* global CATALOGUE */
const PREFIX='terrainx-offline-', META=PREFIX+'metadata', pointer='/__terrainx_prepared__';
self.addEventListener('install',()=>{}); // Updates remain waiting until explicitly prepared and activated.
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
const digest=async body=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',body))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function prepared(){const response=await(await caches.open(META)).match(pointer);return response?response.json():null;}
async function checked(url,expected){
  const response=await fetch(url,{cache:'reload'});
  if(!response.ok)throw Error(`Unavailable: ${url} (${response.status})`);
  const body=await response.clone().arrayBuffer();
  if(body.byteLength!==expected.bytes||await digest(body)!==expected.sha256)throw Error(`Checksum failed: ${url}`);
  return response;
}
self.addEventListener('message',event=>{
  const port=event.ports[0];if(!port)return;
  const send=value=>port.postMessage(value);
  event.waitUntil((async()=>{
    try{
      if(event.data.type==='STATUS'){send({type:'status',prepared:await prepared(),build_id:CATALOGUE.build_id});return;}
      if(event.data.type==='ACTIVATE'){await self.skipWaiting();send({type:'activated'});return;}
      if(event.data.type==='CLEAR'){
        for(const key of await caches.keys())if(key.startsWith(PREFIX))await caches.delete(key);
        send({type:'cleared'});return;
      }
      if(event.data.type!=='PREPARE')return;
      let assets=[...CATALOGUE.assets], historical;
      const requested=event.data.release;
      if(requested&&requested!==CATALOGUE.science_release){
        if(!/^science-[a-f0-9]{16}$/.test(requested))throw Error('Invalid historical release');
        const url=`/releases/${requested}/manifest.json`,response=await fetch(url,{cache:'reload'});
        if(!response.ok)throw Error('Historical science release unavailable');
        const manifest=await response.clone().json();
        if(manifest.release_id!==requested||manifest.model_version!=='terrainx-model-v1')throw Error('Historical identity mismatch');
        const bytes=await response.clone().arrayBuffer();
        assets.push({url,bytes:bytes.byteLength,sha256:await digest(bytes)});
        for(const [name,value] of Object.entries(manifest.files)){
          if(!/^[a-z_]+\.(json|geojson)$/.test(name)||!Number.isSafeInteger(value.bytes)||value.bytes<=0||value.bytes>20000000||! /^[a-f0-9]{64}$/.test(value.sha256))throw Error('Invalid historical file');
          assets.push({url:`/releases/${requested}/${name}`,...value});
        }
        historical=requested;
      }
      const name=PREFIX+'staging-'+CATALOGUE.build_id+'-'+crypto.randomUUID(),cache=await caches.open(name);
      try{
        let done=0,bytes=0;
        for(const asset of assets){await cache.put(asset.url,await checked(asset.url,asset));bytes+=asset.bytes;send({type:'progress',done:++done,total:assets.length,bytes});}
        await cache.put('/offline-index.json',new Response(JSON.stringify(CATALOGUE),{headers:{'Content-Type':'application/json'}}));
        const state={cache:name,build_id:CATALOGUE.build_id,application_commit:CATALOGUE.application_commit,science_release:CATALOGUE.science_release,historical_release:historical??null,files:done,bytes,prepared_at:new Date().toISOString()};
        // Atomic pointer swap: a failed update never replaces a complete cache.
        await(await caches.open(META)).put(pointer,new Response(JSON.stringify(state)));
        send({type:'ready',prepared:state,waiting:self.registration.waiting===self});
      }catch(error){await caches.delete(name);throw error;}
    }catch(error){send({type:'error',message:String(error.message??error)});}
  })());
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/sw.js')return;
  event.respondWith((async()=>{
    const state=await prepared(),cache=state?await caches.open(state.cache):null;
    if(url.pathname==='/offline-index.json'){
      try{return await fetch(event.request,{cache:'no-cache'});}catch{const saved=await cache?.match('/offline-index.json');if(saved)return saved;throw Error('Offline catalogue unavailable');}
    }
    const key=event.request.mode==='navigate'?'/index.html':url.pathname;
    const saved=await cache?.match(key);
    if(saved&&event.request.mode==='navigate'&&saved.redirected){
      // Static hosts may redirect /index.html to /. Navigation uses manual
      // redirects, which cannot consume a redirected Fetch response. Rebuild
      // only the already checksum-verified cached document, preserving bytes.
      // https://www.w3.org/TR/service-workers/#fetch-event-respondwith
      const headers=new Headers(saved.headers);
      headers.delete('content-encoding');headers.delete('content-length');
      return new Response(saved.body,{status:saved.status,statusText:saved.statusText,headers});
    }
    return saved??fetch(event.request);
  })());
});
