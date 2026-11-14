r"""Build visualisation-only 96 x 96 km MOLA/LOLA context grids for the 3D viewer.

Run: .venv\Scripts\python.exe scripts\build_planetary_context.py
Uses the cached full rasters when present (and checks them against the committed
native windows); otherwise uses the committed, checksummed native DN windows.
Outputs data/derived/planetary_context.json and copies it to frontend/public/data/.
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from science.ingestion.planetary_context import build_context


def main() -> None:
    source = ROOT / "data" / "source" / "planetary"
    manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
    rasters = {entry["file"]: entry for entry in manifest["sources"]}
    context = {
        "schema_version": "1.0",
        "built_at": datetime.now(timezone.utc).isoformat(),
        "purpose": "Side-by-side 3D terrain viewer. Visualisation only; never used in F, U, C or P.",
        "caveats": [
            "Heights are shown relative to each patch's own median; Earth, Mars and Moon vertical datums are not comparable.",
            "MOLA native pixels (~3.5 x 3.7 km) are coarser than the 2-km lattice, so the Mars patch is smoother than its true surface.",
            "Broad-scale altimetry cannot show rover-scale rocks, slopes or landing hazards.",
        ],
        "targets": build_context(source, rasters),
    }
    output = ROOT / "data" / "derived" / "planetary_context.json"
    output.write_text(json.dumps(context, separators=(",", ":"), allow_nan=False) + "\n", encoding="utf-8")
    shutil.copyfile(output, ROOT / "frontend" / "public" / "data" / "planetary_context.json")
    for target in context["targets"]:
        flat = [v for row in target["elevations_m"] for v in row]
        print(f"{target['target_id']}: {len(flat)} samples, relief {max(flat) - min(flat):.0f} m over {target['extent_m'] / 1000:.0f} km")


if __name__ == "__main__":
    main()
