/**
 * Visualisation-only Earth context patch, sampled in the browser from AWS Terrain Tiles
 * (terrarium encoding). It mirrors the planetary context grids: 49 x 49 samples at 2 km,
 * inverse azimuthal-equidistant offsets from the candidate centre, bilinear on pixel
 * centres. It is never used for F, U, C or P; those use the cached SRTM samples.
 */
import { TERRARIUM } from "./mapSources";

export const CONTEXT_ZOOM = 8;
const EARTH_RADIUS_M = 6_371_000;
const TILE = 256;

export interface ContextGrid {
  elevations: number[][]; // rows north-to-south, columns west-to-east
  spacingM: number;
  pixelSizeM: number;
  zoom: number;
  tiles: string[];
  retrievedAt: string;
}

/** Same formula as science/ingestion/mola.py point_from_offset. */
export function pointFromOffset(
  latitude: number,
  longitude: number,
  eastM: number,
  northM: number,
  radiusM = EARTH_RADIUS_M,
): [number, number] {
  const distance = Math.hypot(eastM, northM);
  if (distance === 0) return [latitude, longitude];
  const bearing = Math.atan2(eastM, northM),
    angular = distance / radiusM,
    lat1 = (latitude * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lon2 =
    (longitude * Math.PI) / 180 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
}
/** Global Web-Mercator pixel coordinates at a zoom level. */
export function mercatorPixel(lat: number, lon: number, zoom: number) {
  const scale = TILE * 2 ** zoom,
    phi = (lat * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * scale,
    y:
      ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * scale,
  };
}
export function decodeTerrarium(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768;
}

const cache = new Map<string, Promise<ContextGrid>>();

async function loadTile(z: number, x: number, y: number) {
  const url = TERRARIUM.url
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok)
    throw new Error(`Terrain tile ${z}/${x}/${y}: HTTP ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas unavailable for terrain decoding");
  context.drawImage(bitmap, 0, 0);
  return { url, data: context.getImageData(0, 0, TILE, TILE).data };
}

export function earthContext(
  id: string,
  latitude: number,
  longitude: number,
  halfSamples = 24,
  spacingM = 2000,
): Promise<ContextGrid> {
  const key = `${id}:${halfSamples}:${spacingM}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const job = (async () => {
    const zoom = CONTEXT_ZOOM,
      n = 2 * halfSamples + 1;
    const points: { x: number; y: number }[][] = [];
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) {
        const [lat, lon] = pointFromOffset(
          latitude,
          longitude,
          (c - halfSamples) * spacingM,
          (halfSamples - r) * spacingM,
        );
        const p = mercatorPixel(lat, lon, zoom);
        row.push(p);
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      points.push(row);
    }
    const tx0 = Math.floor((minX - 1) / TILE),
      tx1 = Math.floor((maxX + 1) / TILE),
      ty0 = Math.floor((minY - 1) / TILE),
      ty1 = Math.floor((maxY + 1) / TILE);
    const tiles = new Map<string, Uint8ClampedArray>(),
      urls: string[] = [];
    await Promise.all(
      Array.from({ length: (tx1 - tx0 + 1) * (ty1 - ty0 + 1) }, (_, i) => {
        const x = tx0 + (i % (tx1 - tx0 + 1)),
          y = ty0 + Math.floor(i / (tx1 - tx0 + 1));
        return loadTile(zoom, x, y).then(({ url, data }) => {
          tiles.set(`${x}/${y}`, data);
          urls.push(url);
        });
      }),
    );
    const height = (px: number, py: number) => {
      const tx = Math.floor(px / TILE),
        ty = Math.floor(py / TILE),
        data = tiles.get(`${tx}/${ty}`);
      if (!data) throw new Error("Terrain tile coverage incomplete");
      const i = 4 * ((py - ty * TILE) * TILE + (px - tx * TILE));
      return decodeTerrarium(data[i], data[i + 1], data[i + 2]);
    };
    const elevations = points.map((row) =>
      row.map(({ x, y }) => {
        // Pixel centres sit at integer + 0.5.
        const fx = x - 0.5,
          fy = y - 0.5,
          x0 = Math.floor(fx),
          y0 = Math.floor(fy),
          dx = fx - x0,
          dy = fy - y0;
        return (
          height(x0, y0) * (1 - dx) * (1 - dy) +
          height(x0 + 1, y0) * dx * (1 - dy) +
          height(x0, y0 + 1) * (1 - dx) * dy +
          height(x0 + 1, y0 + 1) * dx * dy
        );
      }),
    );
    const pixelSizeM =
      ((2 * Math.PI * EARTH_RADIUS_M) / (TILE * 2 ** zoom)) *
      Math.cos((latitude * Math.PI) / 180);
    return {
      elevations,
      spacingM,
      pixelSizeM,
      zoom,
      tiles: urls.sort(),
      retrievedAt: new Date().toISOString(),
    };
  })();
  cache.set(key, job);
  job.catch(() => cache.delete(key));
  return job;
}
