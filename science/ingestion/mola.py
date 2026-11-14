"""Read the real PDS MOLA 16-ppd topography product using its XML label.

This module also contains the small shared, explicitly validated PDS reader
used for LOLA. No synthetic raster is ever returned on acquisition failure.
"""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import math
from pathlib import Path
import re
import struct
import urllib.request
import xml.etree.ElementTree as ET

MOLA_BASE = "https://pds-geosciences.wustl.edu/mgs/urn-nasa-pds-mgs_mola_topography_derived/meg016/"


def download_cached(url: str, destination: Path) -> dict:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "TerrainX-science/1.0"})
        with urllib.request.urlopen(request, timeout=120) as response:
            # Write atomically so a sudden interruption never leaves a valid-looking cache.
            temporary = destination.with_suffix(destination.suffix + ".partial")
            with temporary.open("wb") as output:
                while chunk := response.read(1024 * 1024):
                    output.write(chunk)
            temporary.replace(destination)
    return {
        "url": url,
        "file": str(destination.name),
        "bytes": destination.stat().st_size,
        "sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
        "retrieved_at": datetime.fromtimestamp(destination.stat().st_mtime, timezone.utc).isoformat(),
    }


def read_product_metadata(xml_file: Path, pds3_file: Path) -> dict:
    """Validate encoding, map geometry, dimensions, scale and vertical meaning.

    PDS4 upper-left corner bounds and pixel centers are authoritative here.
    MOLA's original PDS3 offsets and LOLA's revised PDS3 offsets differ by one;
    applying one generic PDS3 offset formula to both misregisters a pixel.
    """
    root = ET.fromstring(xml_file.read_text(encoding="utf-8"))
    label = pds3_file.read_text(encoding="utf-8")

    def find(name: str) -> str:
        element = root.find(f".//{{*}}{name}")
        if element is None or element.text is None:
            raise ValueError(f"Missing PDS label field: {name}")
        return element.text.strip()

    dimensions = {}
    for axis in root.findall(".//{*}Array_2D_Image/{*}Axis_Array"):
        dimensions[axis.findtext("{*}axis_name")] = int(axis.findtext("{*}elements"))
    if dimensions != {"Line": 2880, "Sample": 5760}:
        raise ValueError(f"Unexpected global 16-ppd dimensions: {dimensions}")
    encoding = find("data_type")
    if encoding not in {"SignedMSB2", "SignedLSB2"}:
        raise ValueError(f"Unsupported sample encoding: {encoding}")
    if float(find("offset")) != 0:
        raise ValueError("Expected a detached zero-offset raster")
    if find("axis_index_order") != "Last Index Fastest":
        raise ValueError("Unexpected binary axis ordering")
    if find("map_projection_name") != "Equirectangular":
        raise ValueError("Expected simple cylindrical / equirectangular map")
    if find("longitude_direction") != "Positive East":
        raise ValueError("Expected 0-360 east-positive longitude")
    if find("latitude_type") != "Planetocentric":
        raise ValueError("Unsupported latitude convention")
    ppd_x, ppd_y = float(find("pixel_scale_x")), float(find("pixel_scale_y"))
    if ppd_x != 16 or ppd_y != 16:
        raise ValueError("Expected 16 pixels/degree")
    bounds = {key: float(find(key)) for key in (
        "west_bounding_coordinate", "east_bounding_coordinate",
        "north_bounding_coordinate", "south_bounding_coordinate")}
    if list(bounds.values()) != [0.0, 360.0, 90.0, -90.0]:
        raise ValueError("Unexpected global bounds")
    radius_m = float(find("a_axis_radius")) * 1000
    if any(float(find(key)) * 1000 != radius_m for key in ("b_axis_radius", "c_axis_radius")):
        raise ValueError("Only a spherical map model is supported")
    # Confirm that the PDS4 upper-left corner agrees with the global bounds
    # before applying the explicit area/pixel-center indexing convention.
    if not math.isclose(float(find("upperleft_corner_x")), -math.pi * radius_m, abs_tol=2):
        raise ValueError("Upper-left x origin inconsistent with global map bounds")
    if not math.isclose(float(find("upperleft_corner_y")), math.pi * radius_m / 2, abs_tol=2):
        raise ValueError("Upper-left y origin inconsistent with global map bounds")
    unit = find("unit").lower()
    if unit != "meter":
        raise ValueError(f"Unexpected vertical unit {unit}")
    scale_match = re.search(r"SCALING_FACTOR\s*=\s*([\d.]+)", label)
    scale = float(scale_match.group(1)) if scale_match else 1.0
    is_lola = encoding == "SignedLSB2"
    if is_lola and (scale != 0.5 or "HEIGHT = (DN * SCALING_FACTOR)" not in label):
        raise ValueError("LOLA height conversion not validated by PDS3 label")
    if not is_lola and (scale != 1 or "areoid" not in label.lower()):
        raise ValueError("MOLA topography/areoid definition is not validated")
    return {
        "product_id": find("logical_identifier"),
        "dataset": "NASA LRO LOLA LDEM_16 V3.1" if is_lola else "NASA MGS MOLA MEGDR 16 ppd v2.0",
        "lines": dimensions["Line"], "samples": dimensions["Sample"],
        "encoding": encoding, "byte_order": "little-endian" if is_lola else "big-endian",
        "sample_bits": 16, "offset_bytes": 0, "vertical_unit": "m",
        "original_unit": "signed integer DN; PDS unit meter, with label scaling applied",
        "converted_unit": "m", "source_organization": "NASA / Goddard Space Flight Center / PDS Geosciences Node",
        "height_scale": scale,
        "height_formula": "height_m = DN * 0.5; reference-radius offset NOT added" if is_lola else "height_m = DN; planetary radius minus GMM3 areoid",
        "vertical_reference": "height above 1737400 m reference sphere" if is_lola else "GMM3 (mgm1025), degree/order 50 areoid",
        "projection": "Equirectangular / simple cylindrical", "pixels_per_degree": ppd_x,
        "latitude_convention": find("latitude_type"), "longitude_convention": "0-360 degrees, positive east",
        "coordinate_system": find("coordinate_system_name"),
        "map_sphere_radius_m": radius_m,
        "pixel_registration": "area / pixel center: lon=(column+0.5)/16; lat=90-(row+0.5)/16, zero-based indices",
        "upperleft_corner_x_m": float(find("upperleft_corner_x")),
        "upperleft_corner_y_m": float(find("upperleft_corner_y")),
        "no_data": "No explicit missing-data constant in this product's PDS label; supplied grid includes source-team interpolation. All extracted DNs are checked against documented global extrema.",
        "valid_dn_range": [-18150, 21580] if is_lola else [-8177, 21171],
        "acquisition_period": {"start": find("start_date_time"), "end": find("stop_date_time")},
        "classification": "derived-from-observed",
    }


def point_from_offset(latitude: float, longitude: float, east_m: float, north_m: float, radius_m: float) -> tuple[float, float]:
    """Inverse spherical azimuthal-equidistant local offsets; radius is label-grounded."""
    distance = math.hypot(east_m, north_m)
    if distance == 0:
        return latitude, longitude % 360
    bearing = math.atan2(east_m, north_m)
    angular = distance / radius_m
    lat1 = math.radians(latitude)
    lat2 = math.asin(math.sin(lat1) * math.cos(angular) + math.cos(lat1) * math.sin(angular) * math.cos(bearing))
    lon2 = math.radians(longitude) + math.atan2(
        math.sin(bearing) * math.sin(angular) * math.cos(lat1),
        math.cos(angular) - math.sin(lat1) * math.sin(lat2))
    return math.degrees(lat2), math.degrees(lon2) % 360


def extract_terrain_grid(image_file: Path, metadata: dict, latitude: float, longitude: float, spacing_m: float = 4000) -> tuple[dict, dict]:
    expected_size = metadata["lines"] * metadata["samples"] * 2
    if image_file.stat().st_size != expected_size:
        raise ValueError(f"Incomplete raster: expected {expected_size} bytes")
    binary = image_file.read_bytes()
    unpack = struct.Struct("<h" if metadata["encoding"] == "SignedLSB2" else ">h")
    ppd = metadata["pixels_per_degree"]
    raw_samples: dict[tuple[int, int], int] = {}
    coordinates = []
    elevations = []

    def dn_at(row: int, col: int) -> int:
        if not (0 <= row < metadata["lines"]):
            raise ValueError("Target sampling window crosses global raster bounds")
        col %= metadata["samples"]
        dn = unpack.unpack_from(binary, 2 * (row * metadata["samples"] + col))[0]
        if not (metadata["valid_dn_range"][0] <= dn <= metadata["valid_dn_range"][1]):
            raise ValueError(f"Invalid/missing DN {dn} at row {row}, column {col}")
        raw_samples[(row, col)] = dn
        return dn

    for grid_row in range(7):
        z_row, coord_row = [], []
        for grid_col in range(7):
            east, north = (grid_col - 3) * spacing_m, (3 - grid_row) * spacing_m
            lat, lon = point_from_offset(latitude, longitude, east, north, metadata["map_sphere_radius_m"])
            row_float, col_float = (90 - lat) * ppd - 0.5, lon * ppd - 0.5
            row, col = math.floor(row_float), math.floor(col_float)
            dy, dx = row_float - row, col_float - col
            interpolated_dn = (
                dn_at(row, col) * (1 - dx) * (1 - dy)
                + dn_at(row, col + 1) * dx * (1 - dy)
                + dn_at(row + 1, col) * (1 - dx) * dy
                + dn_at(row + 1, col + 1) * dx * dy)
            z_row.append(round(interpolated_dn * metadata["height_scale"], 6))
            coord_row.append({"latitude": round(lat, 8), "longitude": round(lon, 8), "x_m": east, "y_m": north})
        elevations.append(z_row)
        coordinates.append(coord_row)
    native_y = math.pi * metadata["map_sphere_radius_m"] / (180 * ppd)
    terrain = {
        "status": "available", "elevations_m": elevations,
        "sample_spacing_m": spacing_m, "footprint_m": spacing_m * 6,
        "grid_shape": [7, 7], "valid_sample_count": 49,
        "native_resolution_m": {"x": round(native_y * math.cos(math.radians(latitude)), 6), "y": round(native_y, 6)},
        "effective_resolution_m": round(native_y, 6),
        "resampling": "bilinear interpolation of validated native pixel-center height values to a 7x7, 4-km local-offset grid; no additional filtering",
        "measurement_scale": "broad regional terrain only, approximately 24x24 km center-to-center footprint; sample lattice is not native pixel resolution",
        "coordinates": coordinates,
        "metadata": metadata,
        "warnings": [
            "MOLA and LOLA have unequal native physical pixel sizes at 16 pixels/degree.",
            "Earth SRTM point samples and planetary gridded/interpolated altimetry have unequal effective resolution; common spacing does not establish identical scale response.",
            "Broad terrain comparison cannot resolve rover-scale rocks, wheel-soil interaction, fine delta geology or landing hazards.",
            "Absolute elevations use different reference surfaces and must not enter cross-body fidelity scores.",
        ],
    }
    native = {
        "description": "Actual source integer DNs used by bilinear extraction, including all four source pixels per sample. These are observations/derived source values, never test fixtures.",
        "sample_bits": 16, "height_scale": metadata["height_scale"],
        "samples": [{"row": row, "column": col, "dn": dn, "latitude": 90 - (row + 0.5) / ppd, "longitude": (col + 0.5) / ppd} for (row, col), dn in sorted(raw_samples.items())],
    }
    return terrain, native


def acquire_mola(cache_dir: Path) -> tuple[dict, dict, list[dict]]:
    manifest = [download_cached(MOLA_BASE + name, cache_dir / name) for name in (
        "megt90n000eb.lbl", "megt90n000eb.xml", "megt90n000eb.hdr", "megt90n000eb.img")]
    metadata = read_product_metadata(cache_dir / "megt90n000eb.xml", cache_dir / "megt90n000eb.lbl")
    terrain, native = extract_terrain_grid(cache_dir / "megt90n000eb.img", metadata, 18.45, 77.45)
    terrain["provenance"] = manifest
    return terrain, native, manifest
