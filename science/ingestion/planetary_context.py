"""Visualisation-only planetary context patches around Jezero and Mare Crisium.

The native MOLA/LOLA DN windows committed under ``data/source/planetary`` were cut
from the same PDS rasters the scoring pipeline uses (whole-file SHA-256 checked
against ``manifest.json`` at extraction time). This module resamples them onto a
common 49 x 49, 2-km local-offset grid (96 x 96 km center-to-center) with the
same bilinear pixel-center rule and inverse azimuthal-equidistant offsets as
``mola.extract_terrain_grid``.

These grids are for the side-by-side 3D viewer only. They never enter F, U, C or P.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import math
from pathlib import Path
import struct

from science.ingestion.mola import point_from_offset, read_product_metadata

CONTEXT_SPACING_M = 2000
CONTEXT_HALF_SAMPLES = 24  # 49 x 49 samples, +/-48 km


@dataclass(frozen=True)
class WindowSpec:
    target_id: str
    body: str
    latitude: float
    longitude: float
    csv_name: str
    label_xml: str
    label_pds3: str
    image_name: str
    image_url: str
    row0: int
    col0: int
    rows: int
    cols: int


WINDOWS = {
    "jezero": WindowSpec(
        "jezero", "Mars", 18.45, 77.45, "mola_jezero_context_window.csv",
        "megt90n000eb.xml", "megt90n000eb.lbl", "megt90n000eb.img",
        "https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/megt90n000eb.img",
        1129, 1223, 31, 33),
    "mare-crisium": WindowSpec(
        "mare-crisium", "Moon", 16.18, 59.10, "lola_mare_crisium_context_window.csv",
        "ldem_16.xml", "ldem_16.lbl", "ldem_16.img",
        "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_16.img",
        1153, 916, 57, 59),
}


def window_csv_text(window: list[list[int]]) -> str:
    """Canonical text form: comma-separated columns, semicolon-separated rows."""
    return ";".join(",".join(str(v) for v in row) for row in window)


def parse_window_csv(text: str, spec: WindowSpec) -> list[list[int]]:
    rows = [[int(v) for v in line.split(",")] for line in text.strip().split(";")]
    if len(rows) != spec.rows or any(len(r) != spec.cols for r in rows):
        raise ValueError(f"{spec.csv_name}: expected {spec.rows}x{spec.cols} DN window")
    return rows


def cut_window_from_image(image: Path, metadata: dict, spec: WindowSpec) -> list[list[int]]:
    """Reproduce the committed window from a locally cached full raster."""
    expected = metadata["lines"] * metadata["samples"] * 2
    if image.stat().st_size != expected:
        raise ValueError(f"Incomplete raster: expected {expected} bytes")
    unpack = struct.Struct("<h" if metadata["encoding"] == "SignedLSB2" else ">h")
    binary = image.read_bytes()
    return [[unpack.unpack_from(binary, 2 * ((spec.row0 + i) * metadata["samples"] + spec.col0 + j))[0]
             for j in range(spec.cols)] for i in range(spec.rows)]


class NativeWindow:
    def __init__(self, spec: WindowSpec, values: list[list[int]], metadata: dict):
        self.spec, self.values, self.metadata = spec, values, metadata

    def dn_at(self, row: int, col: int) -> int:
        i, j = row - self.spec.row0, col - self.spec.col0
        if not (0 <= i < self.spec.rows and 0 <= j < self.spec.cols):
            raise ValueError(f"Pixel ({row}, {col}) lies outside the committed native window")
        dn = self.values[i][j]
        lo, hi = self.metadata["valid_dn_range"]
        if not lo <= dn <= hi:
            raise ValueError(f"Invalid/missing DN {dn} at row {row}, column {col}")
        return dn

    def height_m(self, latitude: float, longitude: float, east_m: float, north_m: float) -> tuple[float, float, float]:
        ppd = self.metadata["pixels_per_degree"]
        lat, lon = point_from_offset(latitude, longitude, east_m, north_m, self.metadata["map_sphere_radius_m"])
        row_float, col_float = (90 - lat) * ppd - 0.5, lon * ppd - 0.5
        row, col = math.floor(row_float), math.floor(col_float)
        dy, dx = row_float - row, col_float - col
        dn = (self.dn_at(row, col) * (1 - dx) * (1 - dy)
              + self.dn_at(row, col + 1) * dx * (1 - dy)
              + self.dn_at(row + 1, col) * (1 - dx) * dy
              + self.dn_at(row + 1, col + 1) * dx * dy)
        return dn * self.metadata["height_scale"], lat, lon

    def grid(self, spacing_m: float, half_samples: int) -> list[list[float]]:
        """Rows north-to-south, columns west-to-east, as in the 7x7 analysis grids."""
        s = self.spec
        return [[round(self.height_m(s.latitude, s.longitude, (c - half_samples) * spacing_m,
                                     (half_samples - r) * spacing_m)[0], 6)
                 for c in range(2 * half_samples + 1)] for r in range(2 * half_samples + 1)]


def load_window(source_dir: Path, spec: WindowSpec) -> tuple[NativeWindow, dict]:
    metadata = read_product_metadata(source_dir / spec.label_xml, source_dir / spec.label_pds3)
    image = source_dir / spec.image_name
    csv_path = source_dir / spec.csv_name
    if image.exists():
        values = cut_window_from_image(image, metadata, spec)
        text = window_csv_text(values)
        if csv_path.exists() and csv_path.read_text(encoding="utf-8").strip() != text:
            raise ValueError(f"{spec.csv_name} disagrees with the cached raster")
        csv_path.write_text(text, encoding="utf-8")
        origin = "cut from locally cached full raster"
    else:
        text = csv_path.read_text(encoding="utf-8").strip()
        values = parse_window_csv(text, spec)
        origin = "committed native DN window (raster not cached locally)"
    return NativeWindow(spec, values, metadata), {
        "window_file": spec.csv_name,
        "window_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
        "window_origin": origin,
        "rows": [spec.row0, spec.row0 + spec.rows - 1],
        "columns": [spec.col0, spec.col0 + spec.cols - 1],
    }


def build_context(source_dir: Path, raster_manifest: dict[str, dict]) -> list[dict]:
    out = []
    for spec in WINDOWS.values():
        window, window_info = load_window(source_dir, spec)
        meta = window.metadata
        native_y = math.pi * meta["map_sphere_radius_m"] / (180 * meta["pixels_per_degree"])
        raster = raster_manifest.get(spec.image_name, {})
        out.append({
            "target_id": spec.target_id,
            "body": spec.body,
            "center": {"latitude": spec.latitude, "longitude": spec.longitude},
            "classification": "VISUALISATION ONLY (derived from observed altimetry; not used for F, U, C or P)",
            "dataset": meta["dataset"],
            "vertical_reference": meta["vertical_reference"],
            "height_formula": meta["height_formula"],
            "sample_spacing_m": CONTEXT_SPACING_M,
            "grid_shape": [2 * CONTEXT_HALF_SAMPLES + 1] * 2,
            "extent_m": 2 * CONTEXT_HALF_SAMPLES * CONTEXT_SPACING_M,
            "coordinate_order": "rows north-to-south, columns west-to-east",
            "native_resolution_m": {"x": round(native_y * math.cos(math.radians(spec.latitude)), 3), "y": round(native_y, 3)},
            "resampling": "bilinear interpolation of native pixel-center heights to a 2-km local-offset grid; no added detail where native pixels are coarser than 2 km",
            "elevations_m": window.grid(CONTEXT_SPACING_M, CONTEXT_HALF_SAMPLES),
            "provenance": {
                "source_url": spec.image_url,
                "raster_sha256": raster.get("sha256"),
                "raster_bytes": raster.get("bytes"),
                **window_info,
            },
        })
    return out
