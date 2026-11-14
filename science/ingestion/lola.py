"""LOLA LDEM_16 real-data ingestion; validates its PDS labels before decoding."""
from pathlib import Path

from science.ingestion.mola import download_cached, extract_terrain_grid, read_product_metadata

LOLA_BASE = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/"
LOLA_DSMAP = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/catalog/dsmap.cat"


def acquire_lola(cache_dir: Path) -> tuple[dict, dict, list[dict]]:
    manifest = [download_cached(LOLA_BASE + name, cache_dir / name) for name in (
        "ldem_16.lbl", "ldem_16.xml", "ldem_16.img")]
    manifest.append(download_cached(LOLA_DSMAP, cache_dir / "dsmap.cat"))
    metadata = read_product_metadata(cache_dir / "ldem_16.xml", cache_dir / "ldem_16.lbl")
    terrain, native = extract_terrain_grid(cache_dir / "ldem_16.img", metadata, 16.18, 59.10)
    terrain["provenance"] = manifest
    return terrain, native, manifest
