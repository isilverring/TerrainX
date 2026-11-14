import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed, CircleSlash, ExternalLink } from "lucide-react";
import { BackLink } from "../components/ui";

type Status = "covered" | "partial" | "gap";
/** Dimensions named on the 2026 challenge page, mapped honestly to what TerrainX does today. */
const DIMENSIONS: { dimension: string; status: Status; what: string; where: [string, string][] }[] = [
  { dimension: "Geology, mineralogy and surface materials", status: "partial", what: "Macrostrat mapped units for all 130 cells and every candidate; basalt / sedimentary relevance per mission. Mapped regional units, not mineralogy.", where: [["/cells", "Search every cell"], ["/cases", "Cases"]] },
  { dimension: "Terrain, elevation, slope, roughness, craters", status: "covered", what: "SRTM 7×7 grids for all 130 cells; MOLA/LOLA targets; slope, relief and roughness metrics; Copernicus common-support pilot; LOLA at the lunar south pole.", where: [["/site/saudi-24.000-39.375", "Analog DNA"], ["/terrain-pilot", "Terrain pilot"], ["/lunar-pole", "Lunar pole"]] },
  { dimension: "Temperature, illumination and environmental extremes", status: "partial", what: "NASA POWER climatology for candidates (not yet for all cells). No Diviner polar temperatures or illumination modelling yet.", where: [["/transfer-lab", "Transfer Lab"]] },
  { dimension: "Water, ice, permafrost and resources", status: "gap", what: "Dryness only (precipitation). No ice, permafrost or lunar volatile data yet.", where: [] },
  { dimension: "Dust, wind, erosion, atmospheric processes", status: "partial", what: "POWER wind and pressure feed dynamic-pressure comparisons with a labelled Mars scenario; no dust-storm data.", where: [["/transfer-lab", "Transfer Lab"]] },
  { dimension: "Biology, extremophiles, habitability, biosignatures", status: "gap", what: "Only cited reference analogs (Salda stromatolites, Yungay clays). No systematic biology layer.", where: [["/worlds", "Compare Worlds"]] },
  { dimension: "Caves, lava tubes, subsurface", status: "gap", what: "Not assessed; coarse 4 km terrain cannot detect them.", where: [] },
  { dimension: "Landing, mobility, navigation, robotic and human operations", status: "partial", what: "Operations-rehearsal lens, Froude scaling, slope forces, field-study traverses and GPX. Not a hazard or traversability survey.", where: [["/lenses", "Lenses"], ["/field-study", "Field study"]] },
  { dimension: "Look beyond well-known analog sites", status: "covered", what: "Systematic search of 130 NASA POWER cells in four regions; mission-aware ranking finds cells absent from the dryness shortlist and the first lunar-eligible mapped-basalt cell.", where: [["/cells", "Search every cell"], ["/frontier", "Frontier"]] },
  { dimension: "Explain what is analogous and what is not", status: "covered", what: "Separate fidelity, utility and coverage; Reality Gap; what Earth cannot reproduce; evidence inspector with sources and limits.", where: [["/methodology", "Methodology"], ["/passport/saudi-24.000-39.375", "Passport"]] },
  { dimension: "Permanent Moon-base locations", status: "partial", what: "LOLA terrain at the IAU centres of NASA's Artemis III region features, with Earth relief twins. No illumination or cold-trap data yet.", where: [["/lunar-pole", "Lunar pole"]] },
  { dimension: "Earth's limits (gravity, vacuum, radiation)", status: "covered", what: "Stated on every dossier, the Transfer Lab and the guided demo.", where: [["/transfer-lab", "Transfer Lab"], ["/demo?presentation=1", "Guided demo"]] },
];
const DATA: [string, string, boolean][] = [
  ["NASA POWER (Earthdata)", "/methodology", true],
  ["NASA GIBS / Worldview imagery", "/explorer", true],
  ["NASA PDS: MOLA MEGDR, LOLA LDEM_16", "/terrain-pilot", true],
  ["NASA LRO LOLA at the lunar south pole", "/lunar-pole", true],
  ["ESA Copernicus DEM (GLO-90)", "/terrain-pilot", true],
  ["NASA LRO Diviner polar temperatures", "", false],
  ["CSA RADARSAT / JAXA G-Portal", "", false],
];
const ICON = { covered: CheckCircle2, partial: CircleDashed, gap: CircleSlash };
const LABEL = { covered: "Covered", partial: "Partial", gap: "Not yet" };

export default function ChallengeFit() {
  const count = (s: Status) => DIMENSIONS.filter((d) => d.status === s).length;
  return (
    <main className="document-page fit-page">
      <BackLink mission="jezero" />
      <header className="document-title">
        <div>
          <p className="document-label">2026 NASA Space Apps · challenge fit</p>
          <h1>What the challenge asks, and where TerrainX stands.</h1>
          <p>
            Every dimension named in “Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars”, with an
            honest status. Gaps are listed as gaps.
          </p>
        </div>
        <div className="fit-score" aria-label="Coverage summary">
          {(["covered", "partial", "gap"] as Status[]).map((s) => (
            <span key={s} className={`fit-chip ${s}`}>
              <b className="mono">{count(s)}</b> {LABEL[s]}
            </span>
          ))}
        </div>
      </header>
      <section className="fit-grid">
        {DIMENSIONS.map((d) => {
          const Icon = ICON[d.status];
          return (
            <article key={d.dimension} className={`fit-card ${d.status}`}>
              <header>
                <Icon size={18} aria-hidden="true" />
                <h2>{d.dimension}</h2>
                <span className="fit-tag">{LABEL[d.status]}</span>
              </header>
              <p>{d.what}</p>
              {d.where.length > 0 && (
                <nav aria-label={`Where: ${d.dimension}`}>
                  {d.where.map(([to, label]) => (
                    <Link key={to} to={to}>
                      {label} →
                    </Link>
                  ))}
                </nav>
              )}
            </article>
          );
        })}
      </section>
      <section className="science-section">
        <h2>Open space-agency data in use</h2>
        <ul className="fit-data">
          {DATA.map(([name, to, used]) => (
            <li key={name} className={used ? "used" : ""}>
              {used ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}
              {used && to ? <Link to={to}>{name}</Link> : <span>{name}</span>}
              {!used && <em>planned</em>}
            </li>
          ))}
        </ul>
        <p className="caption">
          <a href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/" target="_blank" rel="noreferrer">
            Challenge page <ExternalLink size={11} />
          </a>{" "}
          · Independent project; NASA data use does not imply endorsement.
        </p>
      </section>
    </main>
  );
}
