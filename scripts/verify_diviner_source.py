"""Independently verify retained Diviner records against PDS bytes.

Downloads the public product and its published MD5 manifest once; raw files are ignored.
Every retained record must occur verbatim in the independently downloaded source.
"""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys,urllib.request
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'data/source/diviner';DEST.mkdir(parents=True,exist_ok=True)
BASE='https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/'

def acquire(url,target):
    if target.exists():return
    temporary=target.with_suffix(target.suffix+'.partial')
    if target.name=='dlre_prp_south.tab':
        total=604800210;size=8*1024*1024;chunks=DEST/'chunks';chunks.mkdir(exist_ok=True)
        def fetch(start):
            end=min(total,start+size)-1;path=chunks/f'{start}.part'
            if path.exists() and path.stat().st_size==end-start+1:return path
            request=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'})
            for attempt in range(3):
                try:
                    with urllib.request.urlopen(request,timeout=90) as response:
                        if response.status!=206 or response.headers.get('Content-Range')!=f'bytes {start}-{end}/{total}':raise ValueError('Unexpected range response')
                        body=response.read()
                    if len(body)!=end-start+1:raise ValueError('Incomplete range')
                    path.write_bytes(body);return path
                except Exception:
                    if attempt==2:raise
        with ThreadPoolExecutor(max_workers=4) as pool:
            paths=list(pool.map(fetch,range(0,total,size)))
        with temporary.open('wb') as output:
            for path in paths:output.write(path.read_bytes())
        temporary.replace(target);return
    with urllib.request.urlopen(url,timeout=120) as response,temporary.open('wb') as output:
        while chunk:=response.read(1024*1024):output.write(chunk)
    temporary.replace(target)

def main():
    manifest=DEST/'urn-nasa-pds-lro_diviner_derived1.md5';url=BASE+manifest.name
    acquire(url,manifest)
    lines=[line for line in manifest.read_text(encoding='ascii').splitlines() if line.rstrip().replace('\\','/').endswith('data_derived_prp/dlre_prp_south.tab')]
    if len(lines)!=1:raise ValueError('Unique published product checksum not found')
    expected=lines[0].split()[0].lower()
    source=DEST/'dlre_prp_south.tab';product=BASE+'data_derived_prp/dlre_prp_south.tab'
    acquire(product,source)
    md5=hashlib.md5();sha=hashlib.sha256()
    with source.open('rb') as stream:
        while chunk:=stream.read(1024*1024):md5.update(chunk);sha.update(chunk)
    if md5.hexdigest()!=expected:raise ValueError('PDS published MD5 mismatch')
    bundle=json.loads((ROOT/'data/source/acquisition/terrainx-diviner-prp-south-sites.json').read_text(encoding='utf-8'))
    if source.stat().st_size!=bundle['bytes'] or sha.hexdigest()!=bundle['sha256']:raise ValueError('Retained full-stream digest mismatch')
    wanted={line.split('\t',2)[2] for line in bundle['records']};remaining=set(wanted)
    count=0
    with source.open('rb') as stream:
        header=stream.readline()
        for raw in stream:
            if len(raw)!=210 or not raw.endswith(b'\r\n'):raise ValueError('Unexpected fixed record length')
            count+=1;remaining.discard(raw[:-2].decode('ascii'))
    if remaining or count!=bundle['records_scanned']:raise ValueError('Retained records missing or record count mismatch')
    label=bundle['label_xml'].encode('utf-8')
    if hashlib.sha256(label).hexdigest()!=bundle['label_sha256']:raise ValueError('Retained label digest mismatch')
    result={'source_url':product,'bytes':source.stat().st_size,'sha256':sha.hexdigest(),'md5':md5.hexdigest(),
            'published_md5':expected,'published_manifest_url':url,'published_manifest_line':lines[0],
            'published_manifest_sha256':hashlib.sha256(manifest.read_bytes()).hexdigest(),
            'records_scanned':count,'retained_records_verified':len(bundle['records']),'unique_records_verified':len(wanted),
            'label_sha256':bundle['label_sha256'],'verified_at':datetime.now(timezone.utc).isoformat()}
    (DEST/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result))
if __name__=='__main__':main()
