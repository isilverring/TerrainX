import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Columns2,
  Images,
  SplitSquareHorizontal,
} from "lucide-react";
import { BackLink, EvidenceTag, SourceLink } from "../components/ui";

/**
 * Verified original NASA imagery (URLs checked in a browser on 2026-11-14). Captions,
 * instruments, dates and credits are taken from the NASA source pages; where a page does
 * not state something (scale, instrument, date) we say so rather than infer it.
 */
interface WorldImage {
  title: string;
  body: "Earth" | "Mars" | "Moon";
  src: string;
  original: string;
  page: string;
  instrument: string;
  acquired: string;
  credit: string;
  scale: string;
}
interface Pair {
  id: string;
  mission: "jezero" | "mare-crisium";
  benchmark: string;
  heading: string;
  earth: WorldImage;
  planet: WorldImage;
  match: string[];
  contrast: string[];
  conditions: string[];
  limits: string[];
}

const PAIRS: Pair[] = [
  {
    id: "salda-jezero",
    mission: "jezero",
    benchmark: "reference-salda",
    heading: "Lake Salda, Türkiye ↔ Jezero Crater, Mars",
    earth: {
      title: "Lake Salda, Türkiye",
      body: "Earth",
      src: "/nasa/salda.jpg",
      original:
        "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/147000/147041/lakesalda_oli_2020159_lrg.jpg",
      page: "https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/",
      instrument: "Landsat 8 · Operational Land Imager (OLI), natural colour",
      acquired: "8 June 2020",
      credit:
        "NASA Earth Observatory image by Lauren Dauphin, using Landsat data from the U.S. Geological Survey",
      scale: "Not stated on the source page",
    },
    planet: {
      title: "Jezero Crater, Mars",
      body: "Mars",
      src: "/nasa/jezero.jpg",
      original:
        "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/147000/147041/20171204_JezeroCTXMosaic.jpg",
      page: "https://science.nasa.gov/earth/earth-observatory/jez-like-mars-147041/",
      instrument:
        "Mars Reconnaissance Orbiter · Context Camera (CTX) mosaic, greyscale",
      acquired:
        "Not stated on the source page (file name refers to 2017-12-04)",
      credit: "NASA / JPL-Caltech / MSSS / Tanya Harrison",
      scale: "Not stated on the source page",
    },
    match: [
      "Process: NASA describes Lake Salda as an analog for Jezero with similar carbonate mineralogy and deltaic depositional features; carbonates were detected spectrally on Jezero’s western edge.",
      "Material: Salda’s white shoreline is dominated by hydromagnesite (a magnesium carbonate).",
    ],
    contrast: [
      "Landform: Salda is an active lake with alluvial fans; Jezero is an impact crater whose lake and delta are long dry.",
      "Salda hosts living microbialites; no biology has been established on Mars.",
    ],
    conditions: [
      "Earth: dense N₂/O₂ atmosphere, liquid water, rain-driven erosion and vegetation.",
      "Mars: thin CO₂ atmosphere, no persistent stable surface liquid water today; wind and radiation contribute to surface alteration. Surface ice exists.",
    ],
    limits: [
      "Natural-colour Landsat and greyscale CTX are different instruments, bands and resolutions; colour or brightness does not establish mineralogy.",
      "Carbonate identification relies on spectroscopy and samples, not on how an image looks.",
      "Images are not co-registered and their scales are not stated on the source pages.",
    ],
  },
  {
    id: "khaybar-crisium",
    mission: "mare-crisium",
    benchmark: "reference-khaybar",
    heading: "Jabal Qidr, Harrat Khaybar ↔ Mare Crisium, Moon",
    earth: {
      title: "Harrat Khaybar, Saudi Arabia (Jabal Qidr, Abyad, Bayda)",
      body: "Earth",
      src: "/nasa/khaybar.jpg",
      original:
        "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/152000/152839/harratkhaybarzm_oli2_20240425.jpg",
      page: "https://science.nasa.gov/earth/earth-observatory/white-and-black-volcanoes-of-saudi-arabia-152839",
      instrument:
        "Landsat 9 · Operational Land Imager-2 (OLI-2), natural colour",
      acquired: "25 April 2024",
      credit:
        "NASA Earth Observatory images by Lauren Dauphin, using Landsat data from the U.S. Geological Survey",
      scale:
        "Not stated on the source page (Qidr summit crater ≈ 400 m, Bayda crater ≈ 1,400 m per the article)",
    },
    planet: {
      title: "Wrinkle ridge in Mare Crisium, Moon",
      body: "Moon",
      src: "/nasa/crisium.png",
      original:
        "https://assets.science.nasa.gov/content/dam/science/psd/lunar-science/2023/08/wrinkle-ridge-mare-crisium.png",
      page: "https://science.nasa.gov/resource/wrinkle-ridge-in-mare-crisium/",
      instrument: "Not stated on the source page",
      acquired: "Not stated (resource published 20 April 2022)",
      credit: "NASA / GSFC / Arizona State University",
      scale: "Not stated on the source page",
    },
    match: [
      "Material: Jabal Qidr is built from several generations of dark basaltic lava flows; Mare Crisium is a basalt plain formed when lava flooded an ancient impact basin.",
    ],
    contrast: [
      "Landform: Qidr is a volcanic cone with young lava flows; the Crisium image shows a wrinkle ridge, a compressional fold-and-fault structure in mare basalt — a different process.",
      "Harrat Khaybar also contains white silica-rich (comenditic/rhyolitic) domes and tuff cones, so the field is not uniformly basaltic.",
    ],
    conditions: [
      "Earth: atmosphere, wind and water weather the flows; some Khaybar flows are under 1,500 years old.",
      "Moon: vacuum, no wind or water; the surface is altered by impacts and space weathering. Crisium basalts are about 2.5–3.3 billion years old (Luna 24 samples).",
    ],
    limits: [
      "Dark tones in both images do not prove the same composition; basalt identity comes from samples and spectroscopy.",
      "Illumination, viewing geometry and resolution differ completely between the images.",
      "Images are not co-registered and their scales are not stated on the source pages.",
    ],
  },
];

function Img({ im }: { im: WorldImage }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className="img-fallback"
      role="img"
      aria-label={`${im.title}: image unavailable`}
    >
      <strong>{im.title}</strong>
      <span>The NASA image could not be loaded here.</span>
      <a href={im.page} target="_blank" rel="noreferrer">
        Open the NASA source page <ArrowUpRight size={12} />
      </a>
    </div>
  ) : (
    <img
      src={im.src}
      alt={`${im.title} (${im.instrument})`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function Split({ pair }: { pair: Pair }) {
  const [pos, setPos] = useState(50),
    [mode, setMode] = useState<"split" | "side">("side");
  return (
    <div className="worlds-viewer">
      <div className="segmented worlds-mode" role="group" aria-label="Layout">
        <button
          className={mode === "split" ? "active" : ""}
          aria-pressed={mode === "split"}
          onClick={() => setMode("split")}
        >
          <SplitSquareHorizontal size={14} /> Split screen
        </button>
        <button
          className={mode === "side" ? "active" : ""}
          aria-pressed={mode === "side"}
          onClick={() => setMode("side")}
        >
          <Columns2 size={14} /> Side by side
        </button>
      </div>
      {mode === "split" ? (
        <div className="split-frame">
          <div className="split-planet">
            <Img im={pair.planet} />
          </div>
          <div
            className="split-earth"
            style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          >
            <Img im={pair.earth} />
          </div>
          <div
            className="split-divider"
            style={{ left: `${pos}%` }}
            aria-hidden="true"
          >
            <span />
          </div>
          <span className="split-label left">{pair.earth.body}</span>
          <span className="split-label right">{pair.planet.body}</span>
          <input
            className="split-range"
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            aria-label={`Divider position: ${pos}% ${pair.earth.body}`}
          />
        </div>
      ) : (
        <div className="side-frame">
          {[pair.earth, pair.planet].map((im) => (
            <figure key={im.title}>
              <div className="side-img">
                <Img im={im} />
              </div>
              <figcaption>{im.title}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <p className="caption">
        The divider is a viewing aid only: the two images are not co-registered,
        use different instruments and are at different (unstated) scales.
        Side-by-side shows the complete images; split view crops them to its
        frame.
      </p>
    </div>
  );
}

export default function Worlds() {
  return (
    <main className="document-page worlds-page">
      <BackLink mission="jezero" />
      <header className="document-title">
        <div>
          <p className="document-label">
            <Images size={14} /> NASA image studio
          </p>
          <h1>Compare Worlds</h1>
          <p className="frontier-sub">
            Original NASA imagery, side by side — with what it can and cannot
            show. Verified NASA display renditions are bundled for reliable
            demos; original source links remain below.
          </p>
        </div>
      </header>
      {PAIRS.map((pair) => (
        <section key={pair.id} className="science-section worlds-pair">
          <div className="section-heading">
            <h2>{pair.heading}</h2>
            <EvidenceTag kind="LITERATURE-SUPPORTED" />
          </div>
          <Split pair={pair} />
          <div className="worlds-notes">
            {(
              [
                ["Matching process or material", pair.match, "ok"],
                ["Matching or contrasting landform", pair.contrast, "scale"],
                [
                  "Different atmospheric and weathering conditions",
                  pair.conditions,
                  "facility",
                ],
                ["Limits of visual comparison", pair.limits, "open"],
              ] as const
            ).map(([t, items, k]) => (
              <div key={t} className={`gap-card ${k}`}>
                <h3>{t}</h3>
                <ul>
                  {items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="table-scroll">
            <table className="worlds-provenance">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Instrument</th>
                  <th>Acquired</th>
                  <th>Scale / resolution</th>
                  <th>Credit</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {[pair.earth, pair.planet].map((im) => (
                  <tr key={im.title}>
                    <th>{im.title}</th>
                    <td>{im.instrument}</td>
                    <td>{im.acquired}</td>
                    <td>{im.scale}</td>
                    <td>{im.credit}</td>
                    <td>
                      <SourceLink url={im.page}>NASA page</SourceLink>
                      <br />
                      <SourceLink url={im.original}>Original file</SourceLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="worlds-links">
            <Link to={`/site/${pair.benchmark}?mission=${pair.mission}`}>
              Open the benchmark’s Analog DNA <ArrowUpRight size={12} />
            </Link>
            <span>
              Benchmarks are documented references, never counted as new
              discoveries.
            </span>
          </p>
        </section>
      ))}
    </main>
  );
}
