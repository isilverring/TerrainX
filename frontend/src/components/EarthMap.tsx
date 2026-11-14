import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import type {
  Map as MapInstance,
  GeoJSONSource,
  LngLatBoundsLike,
} from "maplibre-gl";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import {
  ChevronDown,
  Globe2,
  Layers,
  LocateFixed,
  Mountain,
  X,
} from "lucide-react";
import type { Candidate, Dataset, Mission } from "../lib/models";
import { number, statusName } from "../lib/data";
import { baseStyle } from "../lib/mapStyle";
import {
  basemapInfo,
  gibsProducts,
  gibsTileUrl,
  offsetLatLon,
  squareAround,
  yesterdayUtc,
} from "../lib/mapSources";
import type { BasemapId } from "../lib/mapSources";
import { fetchScienceJson } from "../lib/release";
import "maplibre-gl/dist/maplibre-gl.css";
maplibregl.setWorkerUrl(workerUrl);

type Region = Dataset["regions"][number];
interface Props {
  candidates: Candidate[];
  selected: Candidate | undefined;
  /** Incremented whenever the user explicitly picks a candidate; only then does the camera move. */
  focus: { id: string; n: number };
  onSelect: (id: string) => void;
  mission: Mission;
  ranks: Map<string, string>;
  regions: Region[];
  region: string;
  onRegion: (id: string) => void;
}
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const OVERLAY_ANCHOR = "hillshade";
/** Leave room for the layer button, legend strip and region labels; smaller on phones. */
const fitPadding = () =>
  window.matchMedia("(max-width: 600px)").matches
    ? { top: 64, bottom: 70, left: 16, right: 46 }
    : { top: 70, bottom: 80, left: 44, right: 120 };
const EXTERNAL_SOURCES: Record<string, string> = {
  basemap: "Esri Dark Gray basemap",
  labels: "Esri reference labels",
  satellite: "Esri World Imagery",
  "nasa-gibs": "NASA GIBS daily imagery",
  bluemarble: "NASA Blue Marble",
  "dem-terrain": "AWS terrain tiles",
  "dem-hillshade": "AWS terrain tiles",
};

function regionBounds(regions: Region[]): LngLatBoundsLike {
  const b = regions.reduce(
    (acc, r) => [
      Math.min(acc[0], r.bounds[0]),
      Math.min(acc[1], r.bounds[1]),
      Math.max(acc[2], r.bounds[2]),
      Math.max(acc[3], r.bounds[3]),
    ],
    [180, 90, -180, -90],
  );
  return [
    [b[0], b[1]],
    [b[2], b[3]],
  ];
}
function emptyCollection(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}
function markerTier(c: Candidate, mission: Mission) {
  if (c.benchmark) return "reference";
  return c.assessments[mission].utility.status === "CHARACTERIZED CANDIDATE"
    ? "characterized"
    : "screened";
}
/** Footprint, sample lattice and POWER cell for the selected candidate. */
function footprintFeatures(c: Candidate | undefined): FeatureCollection {
  if (!c) return emptyCollection();
  const features: Feature[] = [];
  const spacing = c.terrain.sample_spacing_m ?? 4000,
    footprint = c.terrain.footprint_m ?? 24000;
  if (!c.benchmark)
    features.push({
      type: "Feature",
      properties: { kind: "power" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [c.longitude - 0.3125, c.latitude - 0.25],
            [c.longitude + 0.3125, c.latitude - 0.25],
            [c.longitude + 0.3125, c.latitude + 0.25],
            [c.longitude - 0.3125, c.latitude + 0.25],
            [c.longitude - 0.3125, c.latitude - 0.25],
          ],
        ],
      },
    });
  if (c.terrain.status === "available") {
    features.push({
      type: "Feature",
      properties: { kind: "srtm" },
      geometry: {
        type: "Polygon",
        coordinates: [squareAround(c.latitude, c.longitude, footprint / 2)],
      },
    });
    const grid = c.terrain.elevations_m ?? [];
    const values = grid.flat().filter((v): v is number => v != null);
    const lo = Math.min(...values),
      hi = Math.max(...values);
    const n = grid.length,
      half = ((n - 1) / 2) * spacing;
    // Rows are south-to-north and columns west-to-east (dataset coordinate_order).
    grid.forEach((row, i) =>
      row.forEach((z, j) => {
        features.push({
          type: "Feature",
          properties: {
            kind: "sample",
            elevation: z,
            t: z == null || hi === lo ? 0.5 : (z - lo) / (hi - lo),
            valid: z != null,
          },
          geometry: {
            type: "Point",
            coordinates: offsetLatLon(
              c.latitude,
              c.longitude,
              -half + j * spacing,
              -half + i * spacing,
            ),
          },
        });
      }),
    );
  }
  return { type: "FeatureCollection", features };
}
function regionFeatures(regions: Region[], active: string): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: regions.map((r) => {
      const [w, s, e, n] = r.bounds;
      return {
        type: "Feature",
        properties: { id: r.id, active: active === r.id },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [w, s],
              [e, s],
              [e, n],
              [w, n],
              [w, s],
            ],
          ],
        },
      };
    }),
  };
}

export default function EarthMap({
  candidates,
  selected,
  focus,
  onSelect,
  mission,
  ranks,
  regions,
  region,
  onRegion,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapInstance | null>(null),
    markers = useRef(
      new Map<string, { marker: maplibregl.Marker; el: HTMLButtonElement }>(),
    ),
    regionLabels = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false),
    [contextReady, setContextReady] = useState(false),
    [panelOpen, setPanelOpen] = useState(false),
    [basemap, setBasemap] = useState<BasemapId>("dark"),
    [gibsId, setGibsId] = useState("terra"),
    [gibsDate, setGibsDate] = useState("2025-06-01"),
    [cells, setCells] = useState(true),
    [showRegions, setShowRegions] = useState(true),
    [footprint, setFootprint] = useState(true),
    [relief, setRelief] = useState(false),
    [terrain3d, setTerrain3d] = useState(false),
    [exaggeration, setExaggeration] = useState(1.5),
    // Mercator by default: Chile and the Gobi are ~170° apart, so no globe view shows
    // all four study regions at once. The globe stays one click away.
    [globe, setGlobe] = useState(false),
    [zoom, setZoom] = useState(2),
    [failed, setFailed] = useState<Set<string>>(new Set()),
    [fatal, setFatal] = useState(""),
    [toastHidden, setToastHidden] = useState(false);
  const selectRef = useRef(onSelect),
    regionRef = useRef(onRegion);
  selectRef.current = onSelect;
  regionRef.current = onRegion;
  const product = gibsProducts.find((p) => p.id === gibsId) ?? gibsProducts[0];
  const allBounds = useMemo(() => regionBounds(regions), [regions]);

  // ---- Map construction (once) -------------------------------------------------
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    try {
      const instance = new maplibregl.Map({
        container: container.current,
        bounds: allBounds,
        fitBoundsOptions: { padding: fitPadding() },
        minZoom: 0,
        maxZoom: 16,
        maxPitch: 75,
        style: baseStyle(),
        attributionControl: { compact: true },
      });
      map.current = instance;
      instance.once("idle", () => active && setContextReady(true));
      // Keep the compact attribution collapsed to its (i) button until opened.
      const collapseAttribution = () =>
        container.current
          ?.querySelector(".maplibregl-ctrl-attrib.maplibregl-compact-show")
          ?.classList.remove("maplibregl-compact-show");
      instance.once("load", collapseAttribution);
      instance.once("idle", collapseAttribution);
      instance.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          visualizePitch: true,
        }),
        "top-right",
      );
      instance.addControl(
        new maplibregl.ScaleControl({ maxWidth: 110, unit: "metric" }),
        "bottom-right",
      );
      instance.on("zoomend", () => active && setZoom(instance.getZoom()));
      // Overlay readiness must not wait for every remote raster tile to finish.
      instance.once("style.load", async () => {
        if (!active) return;
        try {
          instance.setSky({
            "sky-color": "#0b1424",
            "horizon-color": "#1d3a52",
            "fog-color": "#0b1424",
            "sky-horizon-blend": 0.6,
            "horizon-fog-blend": 0.5,
            "fog-ground-blend": 0.6,
            "atmosphere-blend": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              6,
              0.4,
              10,
              0,
            ],
          });
          const points = await fetchScienceJson<
            FeatureCollection<
              Point,
              { aridity: number | null; land_eligible: boolean }
            >
          >("screened_cells.geojson");
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
          instance.addSource("regions", {
            type: "geojson",
            data: regionFeatures(regions, "all"),
          });
          instance.addSource("screened", { type: "geojson", data: polygons });
          instance.addSource("footprint", {
            type: "geojson",
            data: emptyCollection(),
          });
          instance.addLayer({
            id: "region-fill",
            type: "fill",
            source: "regions",
            paint: {
              "fill-color": "#35C3B0",
              "fill-opacity": ["case", ["get", "active"], 0.06, 0.02],
            },
          });
          instance.addLayer({
            id: "screened-fill",
            type: "fill",
            source: "screened",
            paint: {
              "fill-color": [
                "case",
                ["get", "land_eligible"],
                [
                  "interpolate",
                  ["linear"],
                  ["coalesce", ["get", "aridity"], 0],
                  0,
                  "#3d5a80",
                  0.7,
                  "#2a9d8f",
                  1,
                  "#35C3B0",
                ],
                "#97A8BD",
              ],
              "fill-opacity": 0.14,
            },
          });
          instance.addLayer({
            id: "screened-lines",
            type: "line",
            source: "screened",
            paint: {
              "line-color": "#35C3B0",
              "line-width": 0.6,
              "line-opacity": 0.4,
            },
          });
          instance.addLayer({
            id: "region-lines",
            type: "line",
            source: "regions",
            paint: {
              "line-color": "#C6D7E8",
              "line-width": ["case", ["get", "active"], 1.8, 1],
              "line-opacity": ["case", ["get", "active"], 0.95, 0.55],
              "line-dasharray": [3, 2],
            },
          });
          instance.addLayer({
            id: "footprint-power",
            type: "line",
            source: "footprint",
            filter: ["==", ["get", "kind"], "power"],
            paint: {
              "line-color": "#F2F5FA",
              "line-width": 1.4,
              "line-dasharray": [1, 1.5],
              "line-opacity": 0.85,
            },
          });
          instance.addLayer({
            id: "footprint-srtm-fill",
            type: "fill",
            source: "footprint",
            filter: ["==", ["get", "kind"], "srtm"],
            paint: { "fill-color": "#35C3B0", "fill-opacity": 0.1 },
          });
          instance.addLayer({
            id: "footprint-srtm",
            type: "line",
            source: "footprint",
            filter: ["==", ["get", "kind"], "srtm"],
            paint: { "line-color": "#35C3B0", "line-width": 2 },
          });
          instance.addLayer({
            id: "footprint-samples",
            type: "circle",
            source: "footprint",
            filter: ["==", ["get", "kind"], "sample"],
            minzoom: 7,
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                1.6,
                11,
                4.5,
              ],
              "circle-color": [
                "case",
                ["get", "valid"],
                [
                  "interpolate",
                  ["linear"],
                  ["get", "t"],
                  0,
                  "#1d4e89",
                  0.5,
                  "#35C3B0",
                  1,
                  "#f2e8cf",
                ],
                "#F17E5A",
              ],
              "circle-stroke-color": "#080D18",
              "circle-stroke-width": 0.8,
            },
          });
          // Region labels are HTML so that no remote glyph server is required.
          regionLabels.current = regions.map((r) => {
            const el = document.createElement("button");
            el.className = "region-label";
            el.type = "button";
            el.textContent = r.name;
            el.title = `${r.name}: ${r.rationale}`;
            el.onclick = (e) => {
              e.stopPropagation();
              regionRef.current(r.id);
            };
            return new maplibregl.Marker({
              element: el,
              anchor: "bottom-left",
              opacityWhenCovered: "0",
            })
              .setLngLat([r.bounds[0], r.bounds[3]])
              .addTo(instance);
          });
          setReady(true);
        } catch (err) {
          setFatal(String(err));
        }
      });
      instance.on("error", (event) => {
        if (!active) return;
        const id = "sourceId" in event ? String(event.sourceId) : "";
        if (id in EXTERNAL_SOURCES)
          setFailed((current) =>
            current.has(id) ? current : new Set(current).add(id),
          );
        if (event.error?.message?.includes("WebGL"))
          setFatal(
            "WebGL map unavailable. Select a location from the accessible results list.",
          );
      });
    } catch {
      setFatal(
        "Interactive map unavailable on this device. All scientific results are accessible in the results list.",
      );
    }
    const markerStore = markers.current;
    return () => {
      active = false;
      setReady(false);
      markerStore.forEach(({ marker }) => marker.remove());
      markerStore.clear();
      regionLabels.current.forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Markers: created once per candidate, then updated in place ------------------
  useEffect(() => {
    const instance = map.current;
    if (!instance || !ready) return;
    const store = markers.current,
      wanted = new Set(candidates.map((c) => c.id));
    for (const [id, { marker }] of store)
      if (!wanted.has(id)) {
        marker.remove();
        store.delete(id);
      }
    for (const c of candidates) {
      if (store.has(c.id)) continue;
      const el = document.createElement("button");
      el.type = "button";
      el.onclick = (e) => {
        e.stopPropagation();
        selectRef.current(c.id);
      };
      const marker = new maplibregl.Marker({
        element: el,
        opacityWhenCovered: "0",
      })
        .setLngLat([c.longitude, c.latitude])
        .addTo(instance);
      store.set(c.id, { marker, el });
    }
  }, [candidates, ready]);
  useEffect(() => {
    if (!ready) return;
    for (const c of candidates) {
      const entry = markers.current.get(c.id);
      if (!entry) continue;
      const a = c.assessments[mission],
        rank = ranks.get(c.id) ?? "",
        isSelected = selected?.id === c.id;
      const { el } = entry;
      // Toggle our classes only: MapLibre's own marker classes position the element.
      el.classList.add("map-marker");
      for (const tier of ["characterized", "screened", "reference"])
        el.classList.toggle(tier, tier === markerTier(c, mission));
      el.classList.toggle("selected", isSelected);
      el.setAttribute(
        "aria-label",
        `${rank ? `Rank ${rank}: ` : ""}${c.name}. U ${number(a.utility.value, 0)}, C ${number(100 * a.utility.coverage, 0)}%, F ${number(a.fidelity.value, 0)}`,
      );
      el.setAttribute("aria-pressed", String(isSelected));
      el.replaceChildren();
      const label = document.createElement("span");
      label.className = "marker-rank";
      label.textContent = rank;
      const tip = document.createElement("span");
      tip.className = "marker-tip";
      const name = document.createElement("strong");
      name.textContent = c.name;
      const status = document.createElement("em");
      status.textContent = statusName(a.utility.status);
      const scores = document.createElement("span");
      scores.className = "mono";
      scores.textContent = `F ${number(a.fidelity.value, 0)} · U ${number(a.utility.value, 0)} · C ${number(100 * a.utility.coverage, 0)}%`;
      tip.append(name, status, scores);
      el.append(label, tip);
      entry.marker.getElement().style.zIndex = isSelected ? "3" : "";
    }
  }, [candidates, ready, selected?.id, mission, ranks]);

  // ---- Selected footprint ------------------------------------------------------------
  useEffect(() => {
    const src = map.current?.getSource("footprint") as
      GeoJSONSource | undefined;
    if (ready && src)
      src.setData(footprint ? footprintFeatures(selected) : emptyCollection());
  }, [selected, ready, footprint]);

  // ---- Camera ---------------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m || !ready || !focus.n) return;
    const c = candidates.find((x) => x.id === focus.id);
    if (!c) return;
    m.flyTo({
      center: [c.longitude, c.latitude],
      zoom: terrain3d ? 9.6 : 8.6,
      pitch: terrain3d ? 62 : 0,
      bearing: terrain3d ? -18 : 0,
      duration: reducedMotion() ? 0 : 1600,
      essential: true,
    });
    // Only an explicit user selection moves the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.n, ready]);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource("regions") as GeoJSONSource | undefined)?.setData(
      regionFeatures(regions, region),
    );
    regionLabels.current.forEach((label, i) =>
      label.getElement().classList.toggle("active", regions[i]?.id === region),
    );
    const r = regions.find((x) => x.id === region);
    m.fitBounds(
      r
        ? [
            [r.bounds[0], r.bounds[1]],
            [r.bounds[2], r.bounds[3]],
          ]
        : allBounds,
      {
        padding: fitPadding(),
        pitch: terrain3d ? 45 : 0,
        duration: reducedMotion() ? 0 : 1200,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, ready]);

  // ---- Basemap and imagery ---------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const vis = (id: string, on: boolean) =>
      m.getLayer(id) &&
      m.setLayoutProperty(id, "visibility", on ? "visible" : "none");
    vis("basemap", basemap === "dark");
    vis("labels", basemap === "dark" || basemap === "satellite");
    vis("satellite", basemap === "satellite");
    vis("bluemarble", basemap === "bluemarble");
    if (m.getLayer("nasa-imagery")) m.removeLayer("nasa-imagery");
    if (m.getSource("nasa-gibs")) m.removeSource("nasa-gibs");
    setFailed((current) => {
      if (!current.has("nasa-gibs")) return current;
      const next = new Set(current);
      next.delete("nasa-gibs");
      return next;
    });
    if (basemap === "gibs") {
      m.addSource("nasa-gibs", {
        type: "raster",
        tiles: [gibsTileUrl(product, gibsDate)],
        tileSize: 256,
        maxzoom: 9,
        attribution: `NASA GIBS / ${product.label} · ${gibsDate}`,
      });
      m.addLayer(
        { id: "nasa-imagery", type: "raster", source: "nasa-gibs" },
        OVERLAY_ANCHOR,
      );
    }
  }, [basemap, product, gibsDate, ready]);

  // ---- Overlays ---------------------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const set = (ids: string[], on: boolean) =>
      ids.forEach(
        (id) =>
          m.getLayer(id) &&
          m.setLayoutProperty(id, "visibility", on ? "visible" : "none"),
      );
    set(["screened-fill", "screened-lines"], cells);
    set(["region-fill", "region-lines"], showRegions);
    regionLabels.current.forEach(
      (label) => (label.getElement().style.display = showRegions ? "" : "none"),
    );
    set(["hillshade"], relief);
    // Imagery already carries shading; keep the DEM hillshade subtle on top of it.
    if (m.getLayer("hillshade"))
      m.setPaintProperty(
        "hillshade",
        "hillshade-exaggeration",
        basemap === "dark" ? 0.45 : 0.22,
      );
  }, [cells, showRegions, relief, basemap, ready]);

  // ---- 3D terrain and projection ------------------------------------------------------------
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    if (terrain3d) {
      m.setTerrain({ source: "dem-terrain", exaggeration });
      if (m.getPitch() < 20)
        m.easeTo({ pitch: 58, duration: reducedMotion() ? 0 : 900 });
    } else {
      m.setTerrain(null);
      if (m.getPitch() > 0)
        m.easeTo({ pitch: 0, bearing: 0, duration: reducedMotion() ? 0 : 700 });
    }
  }, [terrain3d, exaggeration, ready]);
  useEffect(() => {
    const m = map.current;
    if (m && ready) m.setProjection({ type: globe ? "globe" : "mercator" });
  }, [globe, ready]);

  function toggle3d() {
    setTerrain3d((on) => {
      if (!on) setRelief(true);
      return !on;
    });
  }
  function fitAll() {
    if (region !== "all") onRegion("all");
    else
      map.current?.fitBounds(allBounds, {
        padding: fitPadding(),
        pitch: 0,
        bearing: 0,
        duration: reducedMotion() ? 0 : 1200,
      });
  }
  const info = basemapInfo[basemap];
  const nativeZoom = info.nativeZoom;
  const overzoomed = zoom > nativeZoom + 0.5;
  const failedNames = [
    ...new Set([...failed].map((id) => EXTERNAL_SOURCES[id])),
  ];
  const gibsFailed = failed.has("nasa-gibs") && basemap === "gibs";
  const today = yesterdayUtc();
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
        <div className="atlas-tools" role="group" aria-label="Map view">
          <button
            className={globe ? "active" : ""}
            onClick={() => setGlobe(!globe)}
            aria-pressed={globe}
            title={
              globe ? "Switch to flat Mercator map" : "Switch to globe view"
            }
          >
            <Globe2 size={16} />
            <span>Globe</span>
          </button>
          <button
            className={terrain3d ? "active" : ""}
            onClick={toggle3d}
            aria-pressed={terrain3d}
            title="Toggle 3D terrain (visualisation DEM, not used for scoring)"
          >
            <Mountain size={16} />
            <span>3D</span>
          </button>
          <button
            title="Show all study regions"
            aria-label="Show all study regions"
            onClick={fitAll}
          >
            <LocateFixed size={16} />
          </button>
        </div>
      </div>
      <div
        className="map-canvas"
        ref={container}
        data-context-ready={contextReady}
      />
      {!contextReady && !fatal ? (
        <div className="map-loading" role="status">
          Loading geographic context…
        </div>
      ) : null}
      {fatal ? (
        <div className="map-error" role="alert">
          {fatal}
        </div>
      ) : null}
      <div className={`map-control ${panelOpen ? "open" : ""}`}>
        <button
          className="map-control-toggle"
          onClick={() => setPanelOpen(!panelOpen)}
          aria-expanded={panelOpen}
        >
          <Layers size={14} />
          Layers & legend
          <ChevronDown size={14} />
        </button>
        {panelOpen ? (
          <div className="map-control-body">
            <fieldset className="basemap-choice">
              <legend>Basemap</legend>
              {(Object.keys(basemapInfo) as BasemapId[]).map((id) => (
                <label key={id} className={basemap === id ? "active" : ""}>
                  <input
                    type="radio"
                    name="basemap"
                    value={id}
                    checked={basemap === id}
                    onChange={() => setBasemap(id)}
                  />
                  {basemapInfo[id].label}
                </label>
              ))}
            </fieldset>
            {basemap === "gibs" ? (
              <div className="gibs-options">
                <label>
                  Product
                  <select
                    value={gibsId}
                    onChange={(e) => setGibsId(e.target.value)}
                  >
                    {gibsProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Acquisition date (UTC)
                  <input
                    type="date"
                    value={gibsDate}
                    min={product.start}
                    max={today}
                    onChange={(e) =>
                      e.target.value && setGibsDate(e.target.value)
                    }
                  />
                </label>
                <small>
                  Daily swaths: black stripes are gaps between orbits, and
                  clouds can hide the surface. Native zoom ≤ 9.
                </small>
                {gibsFailed ? (
                  <small className="gibs-warning" role="status">
                    GIBS returned no tiles for {product.label} on {gibsDate}.
                    Try another date or product.
                  </small>
                ) : null}
              </div>
            ) : null}
            <fieldset>
              <legend>Overlays</legend>
              <label>
                <input
                  type="checkbox"
                  checked={cells}
                  onChange={(e) => setCells(e.target.checked)}
                />
                Screened POWER cells
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showRegions}
                  onChange={(e) => setShowRegions(e.target.checked)}
                />
                Study-region boxes
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={footprint}
                  onChange={(e) => setFootprint(e.target.checked)}
                />
                Selected analysis footprint
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={relief}
                  onChange={(e) => setRelief(e.target.checked)}
                />
                Hillshade relief
              </label>
            </fieldset>
            <fieldset>
              <legend>3D terrain</legend>
              <label>
                <input
                  type="checkbox"
                  checked={terrain3d}
                  onChange={toggle3d}
                />
                Show 3D terrain
              </label>
              <label className="range-label">
                Vertical exaggeration
                <b className="mono">×{exaggeration.toFixed(1)}</b>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={exaggeration}
                  disabled={!terrain3d}
                  onChange={(e) => setExaggeration(Number(e.target.value))}
                />
              </label>
              <small>
                Visualisation DEM (AWS terrain tiles). Never used for F, U or C.
              </small>
            </fieldset>
            <div className="map-legend">
              <span>
                <i className="legend-marker characterized" />
                Characterized candidate
              </span>
              <span>
                <i className="legend-marker screened" />
                Screened · more evidence needed
              </span>
              <span>
                <i className="legend-marker reference" />
                Benchmark reference
              </span>
              <span>
                <i className="legend-cell" />
                POWER cell 0.5° × 0.625°
              </span>
              <span>
                <i className="legend-power" />
                Selected POWER cell
              </span>
              <span>
                <i className="legend-srtm" />
                24 × 24 km SRTM sample lattice
              </span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="map-footer">
        <div className="legend-strip" aria-label="Marker legend">
          <span>
            <i className="legend-marker characterized" />
            Characterized
          </span>
          <span>
            <i className="legend-marker screened" />
            Screened
          </span>
          <span>
            <i className="legend-marker reference" />
            Benchmark
          </span>
        </div>
        <div className="imagery-badge" aria-live="polite">
          <strong>
            {basemap === "gibs"
              ? `NASA GIBS · ${product.label} · ${gibsDate}`
              : info.short}
          </strong>
          <span>
            native zoom ≤ {nativeZoom}
            {overzoomed ? " · overzoomed" : ""} · interpretation only, not
            mineralogy
          </span>
        </div>
      </div>
      {failedNames.length && !toastHidden && !gibsFailed ? (
        <div className="map-toast" role="status">
          <span>
            Unavailable: {failedNames.join(", ")}. Local coastlines, markers and
            cached results still work.
          </span>
          <button onClick={() => setToastHidden(true)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      ) : null}
      <div className="atlas-scale-note">
        POWER climate cell (~55 km) ≠ SRTM terrain lattice (24 km) ≠ field
        subsite
      </div>
    </section>
  );
}
