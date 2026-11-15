"""Copy verified staged source objects to the existing source cache on explicit --apply.

Does not modify any existing source object or either manifest. Tracked XML/EULA
promotion and versioned manifest integration are separate processing steps.
"""
from pathlib import Path
import hashlib,json,shutil,sys
ROOT=Path(__file__).resolve().parents[1];SOURCE=(ROOT/'data/source/pilot').resolve();OUT=ROOT/'outputs/m5-assets'
m=json.loads((OUT/'manifest.validated.json').read_text())
if not m['validation']['complete']:raise SystemExit('Manifest validation is incomplete')
copies=[]
for a in m['assets']:
 target=(SOURCE/a['relative_path']).resolve()
 if not target.is_relative_to(SOURCE):raise SystemExit('Unsafe source path')
 staged=OUT/'cache'/a['relative_path']
 origin=staged if staged.exists() else target
 body=origin.read_bytes()
 if len(body)!=a['bytes'] or hashlib.sha256(body).hexdigest()!=a['sha256']:raise SystemExit('Checksum mismatch: '+str(origin))
 if target.exists():
  if hashlib.sha256(target.read_bytes()).hexdigest()!=a['sha256']:raise SystemExit('Refusing to overwrite different source: '+str(target))
 else:copies.append((origin,target))
if '--apply' in sys.argv:
 for origin,target in copies:
  target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(origin,target)
 print('Copied',len(copies),'verified new source objects; original manifest unchanged.')
else:print('Dry run:',len(copies),'verified new source objects ready; rerun --apply to copy. No manifest is written.')
