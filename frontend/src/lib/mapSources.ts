/**
 * External map imagery and elevation tile definitions.
 *
 * Every endpoint below was checked from a browser on 2026-11-14 (HTTP 200, CORS-readable).
 * Imagery supports geographic interpretation only: it never establishes mineralogy, and
 * the visualisation DEM (AWS terrarium) is never used for any score. Scores use the cached
 * SRTM point samples recorded in the dataset.
 */
export type BasemapId = "dark" | "satellite" | "gibs" | "bluemarble";

export interface GibsProduct {
  id: string;
  label: string;
  layer: string;
  start: string;
  /** Latest date verified to return tiles at the check date, if the product has a known gap. */
  verifiedEnd?: string;
}
export const GIBS_ROOT = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
export const GIBS_MATRIX = "GoogleMapsCompatible_Level9";
export const GIBS_MAX_ZOOM = 9;
export const gibsProducts: GibsProduct[] = [
  {
    id: "terra",
    label: "MODIS Terra true colour",
    layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
    start: "2000-02-24",
  },
  {
    id: "aqua",
    label: "MODIS Aqua true colour",
    layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
    start: "2002-07-04",
  },
  {
    id: "viirs",
    label: "VIIRS Suomi NPP true colour",
    layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    start: "2015-11-24",
    verifiedEnd: "2026-11-02",
  },
];
export function gibsTileUrl(product: GibsProduct, date: string) {
  return `${GIBS_ROOT}/${product.layer}/default/${date}/${GIBS_MATRIX}/{z}/{y}/{x}.jpg`;
}
export const BLUE_MARBLE = {
  layer: "BlueMarble_ShadedRelief_Bathymetry",
  url: `${GIBS_ROOT}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`,
  maxzoom: 8,
  attribution:
    'NASA Earth Observatory Blue Marble (Aug 2004) via <a href="https://www.earthdata.nasa.gov/gibs">NASA GIBS</a>',
};
export const ESRI = {
  dark: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  darkLabels:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  imagery:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  darkAttribution:
    'Esri, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, GIS user community',
  imageryAttribution:
    "Imagery: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
};
export const TERRARIUM = {
  url: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
  maxzoom: 15,
  attribution:
    'Terrain Tiles: <a href="https://registry.opendata.aws/terrain-tiles/">AWS Open Data / Mapzen</a> (SRTM, GMTED2010, ETOPO1 and others) · visualisation only',
};
export const basemapInfo: Record<
  BasemapId,
  { label: string; short: string; nativeZoom: number }
> = {
  dark: { label: "Dark atlas", short: "Esri Dark Gray Canvas", nativeZoom: 16 },
  satellite: {
    label: "Satellite",
    short: "Esri World Imagery (mosaic, mixed dates)",
    nativeZoom: 17,
  },
  gibs: { label: "NASA daily", short: "NASA GIBS", nativeZoom: GIBS_MAX_ZOOM },
  bluemarble: {
    label: "Blue Marble",
    short: "NASA Blue Marble relief · Aug 2004",
    nativeZoom: 8,
  },
};
export function yesterdayUtc() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

/** Geometry helpers. Earth mean radius matches the science pipeline (6,371,000 m). */
const R = 6_371_000;
export function offsetLatLon(lat: number, lon: number, dx: number, dy: number) {
  const dLat = (dy / R) * (180 / Math.PI),
    dLon = (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
  return [lon + dLon, lat + dLat] as [number, number];
}
export function squareAround(lat: number, lon: number, halfM: number) {
  const ring = [
    offsetLatLon(lat, lon, -halfM, -halfM),
    offsetLatLon(lat, lon, halfM, -halfM),
    offsetLatLon(lat, lon, halfM, halfM),
    offsetLatLon(lat, lon, -halfM, halfM),
  ];
  return [...ring, ring[0]];
}
