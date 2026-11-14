"""Cache public-domain Natural Earth land boundaries for illustration and land screening."""
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from science.ingestion.cache import CachedHTTP,atomic_json

URL="https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson"
record=CachedHTTP().get(URL)
atomic_json(ROOT/"data/source/ne_110m_land.geojson",record["data"])
atomic_json(ROOT/"frontend/public/data/land.geojson",record["data"])
atomic_json(ROOT/"data/source/land_provenance.json",{k:v for k,v in record.items() if k!="data"}|{"dataset":"Natural Earth110m land","license":"public domain","purpose":"Broad land mask and decorative geographic globe; not scientific terrain or mineralogy."})
print("Cached genuine Natural Earth land boundaries")
