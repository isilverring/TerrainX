import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type { Map as MapInstance } from "maplibre-gl";
import type { FeatureCollection, Point, Polygon } from "geojson";
import { Layers, LocateFixed } from "lucide-react";
import type { Candidate } from "../lib/models";
import "maplibre-gl/dist/maplibre-gl.css";
maplibregl.setWorkerUrl(workerUrl);

interface Props {
  candidates: Candidate[];
  selected: Candidate | undefined;
  onSelect: (id: string) => void;
}
export default function EarthMap({ candidates, selected, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null);
  const [ready, setReady] = useState(false),
    [contextReady, setContextReady] = useState(false),
    [imagery, setImagery] = useState(false),
    [cells, setCells] = useState(true),
    [error, setError] = useState("");
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    try {
      const instance = new maplibregl.Map({
        container: container.current,
        center: [28, 14],
        zoom: 1.25,
        minZoom: 1,
        maxZoom: 16,
        style: {
          version: 8,
          sources: {
            land: {
              type: "geojson",
              data: "/data/land.geojson",
              attribution: "Natural Earth",
            },
            basemap: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              maxzoom: 10,
              attribution:
                'Esri, HERE, Garmin, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, GIS user community',
            },
            labels: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              maxzoom: 10,
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
              paint: { "raster-opacity": 0.8 },
            },
            { id: "labels", type: "raster", source: "labels" },
          ],
        },
        attributionControl: { compact: false },
      });
      map.current = instance;
      instance.once("idle", () => {
        if (active) setContextReady(true);
      });
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      // Overlay readiness must not wait for every remote raster tile to finish.
      instance.once("style.load", async () => {
        if (!active) return;
        try {
          const response = await fetch("/data/screened_cells.geojson");
          if (!response.ok) throw new Error("Screening layer unavailable");
          const points = (await response.json()) as FeatureCollection<
            Point,
            { aridity: number | null; land_eligible: boolean }
          >;
          const polygons: FeatureCollection<Polygon> = {
            type: "FeatureCollection",
            features: points.features.map((feature) => {
              const [x, y] = feature.geometry.coordinates;
              return {
                type: "Feature",
                properties: feature.properties,
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [x - 0.3125, y - 0.25],
                      [x + 0.3125, y - 0.25],
                      [x + 0.3125, y + 0.25],
                      [x - 0.3125, y + 0.25],
                      [x - 0.3125, y - 0.25],
                    ],
                  ],
                },
              };
            }),
          };
          instance.addSource("screened", { type: "geojson", data: polygons });
          instance.addLayer({
            id: "screened-fill",
            type: "fill",
            source: "screened",
            paint: {
              "fill-color": [
                "case",
                ["get", "land_eligible"],
                "#35C3B0",
                "#97A8BD",
              ],
              "fill-opacity": 0.12,
            },
          });
          instance.addLayer({
            id: "screened-lines",
            type: "line",
            source: "screened",
            paint: {
              "line-color": "#35C3B0",
              "line-width": 0.6,
              "line-opacity": 0.45,
            },
          });
          instance.addSource("nasa-gibs", {
            type: "raster",
            tiles: [
              "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2025-06-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg",
            ],
            tileSize: 256,
            maxzoom: 9,
            attribution: "NASA GIBS / MODIS Terra · 2025-06-01",
          });
          instance.addLayer(
            {
              id: "nasa-imagery",
              type: "raster",
              source: "nasa-gibs",
              layout: { visibility: "none" },
              paint: { "raster-opacity": 0.78 },
            },
            "screened-fill",
          );
          setReady(true);
        } catch (err) {
          setError(String(err));
        }
      });
      instance.on("error", (event) => {
        if (
          active &&
          "sourceId" in event &&
          ["basemap", "labels", "nasa-gibs"].includes(String(event.sourceId))
        ) {
          setError(
            "Some external map tiles are unavailable. The local Natural Earth coastlines, candidate markers and cached scientific results remain accessible.",
          );
        }
        if (active && event.error?.message?.includes("WebGL"))
          setError(
            "WebGL map unavailable. Select a location from the accessible results list.",
          );
      });
    } catch {
      setError(
        "Interactive map unavailable on this device. All scientific results are accessible in the results list.",
      );
    }
    return () => {
      active = false;
      setReady(false);
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const markers = candidates.map((c) => {
      const element = document.createElement("button");
      element.className = `map-marker ${c.benchmark ? "reference" : c.status === "CHARACTERIZED CANDIDATE" ? "characterized" : "screened"} ${selected?.id === c.id ? "selected" : ""}`;
      element.setAttribute("aria-label", `Select ${c.name}`);
      element.title = c.name;
      element.onclick = () => selectRef.current(c.id);
      return new maplibregl.Marker({ element })
        .setLngLat([c.longitude, c.latitude])
        .addTo(instance);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [candidates, ready, selected?.id]);
  useEffect(() => {
    if (map.current && ready && selected)
      map.current.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: 5.2,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 1000,
      });
  }, [selected?.id, ready]);
  useEffect(() => {
    const m = map.current;
    if (ready && m?.getLayer("nasa-imagery"))
      m.setLayoutProperty(
        "nasa-imagery",
        "visibility",
        imagery ? "visible" : "none",
      );
  }, [imagery, ready]);
  useEffect(() => {
    const m = map.current;
    if (ready && m)
      for (const layer of ["screened-fill", "screened-lines"])
        m.setLayoutProperty(layer, "visibility", cells ? "visible" : "none");
  }, [cells, ready]);
  return (
    <section
      className="atlas-panel"
      aria-label="Interactive Earth discovery atlas"
    >
      <div className="atlas-heading">
        <div>
          <h2>Earth discovery atlas</h2>
          <span>Real observations. Regional perspective.</span>
        </div>
        <button
          title="Show all study regions"
          aria-label="Show all study regions"
          onClick={() => map.current?.flyTo({ center: [28, 14], zoom: 1.25 })}
        >
          <LocateFixed size={18} />
        </button>
      </div>
      <div
        className="map-canvas"
        ref={container}
        data-context-ready={contextReady}
      />
      {!contextReady && !error ? (
        <div className="map-loading" role="status">
          Loading geographic context…
        </div>
      ) : null}
      {error ? (
        <div className="map-error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="map-layers">
        <span>
          <Layers size={14} />
          Map layers
        </span>
        <label>
          <input
            type="checkbox"
            checked={cells}
            onChange={(e) => setCells(e.target.checked)}
          />
          Screened cells
        </label>
        <label>
          <input
            type="checkbox"
            checked={imagery}
            onChange={(e) => setImagery(e.target.checked)}
          />
          NASA GIBS imagery
        </label>
        {imagery ? (
          <small>
            MODIS Terra · 01 Jun 2025 · max native zoom9
            <br />
            Clouds/overpass gaps may obscure terrain.
          </small>
        ) : null}
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-cell" />
          POWER cell
        </span>
        <span>
          <i className="legend-candidate" />
          Shortlist
        </span>
        <span>
          <i className="legend-reference" />
          Reference
        </span>
      </div>
      <div className="atlas-scale-note">
        Climate grid ≠ terrain footprint ≠ field subsite
      </div>
    </section>
  );
}
