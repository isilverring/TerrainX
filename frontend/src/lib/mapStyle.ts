import type { StyleSpecification } from "maplibre-gl";
import { BLUE_MARBLE, ESRI, TERRARIUM } from "./mapSources";
import { scienceAssetUrl } from "./release";

/** Base atlas style: local Natural Earth fallback underneath every remote layer. */
export function baseStyle(): StyleSpecification {
  return {
    version: 8,
    projection: { type: "mercator" },
    sources: {
      land: {
        type: "geojson",
        data: scienceAssetUrl("land.geojson"),
        attribution: "Natural Earth",
      },
      basemap: {
        type: "raster",
        tiles: [ESRI.dark],
        tileSize: 256,
        maxzoom: 16,
        attribution: ESRI.darkAttribution,
      },
      labels: {
        type: "raster",
        tiles: [ESRI.darkLabels],
        tileSize: 256,
        maxzoom: 16,
      },
      satellite: {
        type: "raster",
        tiles: [ESRI.imagery],
        tileSize: 256,
        maxzoom: 17,
        attribution: ESRI.imageryAttribution,
      },
      bluemarble: {
        type: "raster",
        tiles: [BLUE_MARBLE.url],
        tileSize: 256,
        maxzoom: BLUE_MARBLE.maxzoom,
        attribution: BLUE_MARBLE.attribution,
      },
      "dem-terrain": {
        type: "raster-dem",
        tiles: [TERRARIUM.url],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: TERRARIUM.maxzoom,
        attribution: TERRARIUM.attribution,
      },
      "dem-hillshade": {
        type: "raster-dem",
        tiles: [TERRARIUM.url],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: TERRARIUM.maxzoom,
        attribution: TERRARIUM.attribution,
      },
    },
    layers: [
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#090f19" },
      },
      {
        id: "land",
        type: "fill",
        source: "land",
        paint: { "fill-color": "#1d3149" },
      },
      {
        id: "coastlines",
        type: "line",
        source: "land",
        paint: { "line-color": "#48647e", "line-width": 0.5 },
      },
      {
        id: "basemap",
        type: "raster",
        source: "basemap",
        paint: { "raster-opacity": 0.85 },
      },
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        layout: { visibility: "none" },
      },
      {
        id: "bluemarble",
        type: "raster",
        source: "bluemarble",
        layout: { visibility: "none" },
      },
      {
        id: "hillshade",
        type: "hillshade",
        source: "dem-hillshade",
        layout: { visibility: "none" },
        paint: {
          "hillshade-shadow-color": "#02060c",
          "hillshade-highlight-color": "#c6d7e8",
          "hillshade-accent-color": "#0c1828",
          "hillshade-exaggeration": 0.45,
        },
      },
      { id: "labels", type: "raster", source: "labels" },
    ],
  };
}
