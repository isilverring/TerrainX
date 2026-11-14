r"""Rebuild genuine planetary terrain grids; failures remain explicitly unavailable.

Run from any directory: .venv\Scripts\python.exe scripts\build_planetary_profiles.py
Raw 33-MB raster files are download-cached and ignored by Git. Detached labels,
checksums and exact native sample values are committed for reproducible review.
"""
from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from science.ingestion.mola import acquire_mola, MOLA_BASE
from science.ingestion.lola import acquire_lola, LOLA_BASE


def build_profiles() -> list[dict]:
    cache = ROOT / "data" / "source" / "planetary"
    output = ROOT / "data" / "derived"
    output.mkdir(parents=True, exist_ok=True)
    targets = [
        {
            "id": "jezero", "body": "Mars", "name": "Jezero Crater",
            "latitude": 18.45, "longitude": 77.45,
            "mission": "Sedimentary sampling and rover geological fieldwork",
            "context": "Ancient lake and delta environments motivate sedimentary sampling, lacustrine-process study and mineral-preservation experiments. Carbonate relevance must be independently supported at each Earth subsite.",
            "source_refs": [
                {"id": "mola-megdr", "title": "NASA PDS MGS MOLA MEGDR topography", "organization": "NASA PDS / Washington University", "url": "https://pds-geosciences.wustl.edu/missions/mgs/megdr.html", "classification": "measured-and-gridded"},
                {"id": "nasa-jezero-salda", "title": "Jez Like Mars", "organization": "NASA Earth Observatory", "url": "https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/", "classification": "literature-supported"},
            ],
        },
        {
            "id": "mare-crisium", "body": "Moon", "name": "Mare Crisium",
            "latitude": 16.18, "longitude": 59.10,
            "mission": "Basaltic sampling, navigation and surface-operations field tests",
            "context": "Mare Crisium contains a basalt-flooded ancient impact basin and compressional wrinkle ridges. Terrestrial basaltic sites can support geological and navigation workflows, but Earth cannot reproduce lunar gravity, vacuum, radiation or regolith mechanics.",
            "source_refs": [
                {"id": "lola-gdrdem", "title": "LRO LOLA Gridded Data Record Shape Map", "organization": "NASA PDS / Washington University", "url": "https://ode.rsl.wustl.edu/moon/pagehelp/Content/Missions_Instruments/Lunar%20Reconnaissance%20Orbiter%20(LRO)/LOLA/GDR/GDRDEM.htm", "classification": "measured-and-gridded"},
                {"id": "nasa-mare-crisium", "title": "Wrinkle Ridge in Mare Crisium", "organization": "NASA / GSFC / Arizona State University", "url": "https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/", "classification": "literature-supported"},
            ],
        },
    ]
    complete_manifest = []
    for target, acquire in zip(targets, (acquire_mola, acquire_lola)):
        try:
            terrain, native, manifest = acquire(cache)
            target["terrain"] = terrain
            native["target_id"] = target["id"]
            native["provenance"] = manifest
            (cache / f"{target['id']}-native-samples.json").write_text(json.dumps(native, indent=2, allow_nan=False) + "\n", encoding="utf-8")
            complete_manifest.extend(manifest)
            print(f"{target['name']}: real 7x7 terrain grid available; native y resolution {terrain['native_resolution_m']['y']:.2f} m")
        except Exception as error:
            target["terrain"] = {"status": "unavailable", "elevations_m": None, "reason": str(error), "sample_spacing_m": 4000, "footprint_m": 24000}
            print(f"{target['name']}: unavailable: {error}", file=sys.stderr)
    (output / "planetary_targets.json").write_text(json.dumps(targets, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    (cache / "manifest.json").write_text(json.dumps({"built_at": datetime.now(timezone.utc).isoformat(), "sources": complete_manifest}, indent=2) + "\n", encoding="utf-8")
    return targets


if __name__ == "__main__":
    build_profiles()
