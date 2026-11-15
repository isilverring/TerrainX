import { Link } from "react-router-dom";
import {
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import { BackLink } from "../components/ui";
import { useData } from "../lib/data";
import { useScienceFile } from "../lib/scienceFile";
import { LAB_MODULES, challengeEvidenceSchema, type LabModule } from "../lib/researchLab";

type Status = "covered" | "bounded" | "gap";
/**
 * Suggested challenge dimensions; these are optional avenues, not a compliance checklist.
 * "bounded" means a working analysis workflow with source-scoped evidence: what is measured,
 * what is only modeled, and what software cannot supply are listed separately.
 */
type Dimension = {
  dimension: string;
  status: Status;
  what: string;
  where: [string, string][];
  lab?: LabModule;
  /** Evidence-registry categories counted as reference records for this dimension. */
  categories?: string[];
  measured?: string;
  modeled?: string;
  unknown?: string;
};
const DIMENSIONS: Dimension[] = [
  {
    dimension: "Geology, mineralogy and surface materials",
    status: "bounded",
    lab: "mineralogy",
    categories: ["mineralogy", "surface_materials"],
    what: "Macrostrat mapped context for 129/130 cells and 19/20 released sites, with basalt or sedimentary relevance per mission.",
    measured: "Published XRD and mineral data at the Salda and Yungay reference stations.",
    modeled: "Mapped regional units and keyword relevance. These are not mineral maps.",
    unknown: "Outcrop mineralogy at the candidate cells. That needs samples.",
    where: [
      ["/cells", "Search every cell"],
      ["/cases", "Cases"],
    ],
  },
  {
    dimension: "Terrain, elevation, slope, roughness, craters",
    status: "covered",
    what: "SRTM 7×7 grids for all 130 cells; MOLA/LOLA targets; slope, relief and roughness metrics; Copernicus common-support pilot; LOLA at the lunar south pole.",
    where: [
      ["/site/saudi-24.000-39.375", "Analog DNA"],
      ["/terrain-pilot", "Terrain pilot"],
      ["/lunar-pole", "Lunar pole"],
    ],
  },
  {
    dimension: "Temperature, illumination and environmental extremes",
    status: "bounded",
    lab: "illumination",
    what: "NASA POWER climatology and 2025 daily envelopes for Earth cells. On the Moon, SPICE solar geometry with LOLA horizons at eight feature centres, plus Diviner thermal summaries.",
    measured: "Diviner-derived lunar temperatures and POWER reanalysis air temperatures. These are different observables.",
    modeled: "Hourly solar fraction over 2025 with a bounded 72-ray horizon.",
    unknown: "Ground-truth illumination at a landing polygon, and an exact thermal analog.",
    where: [
      ["/transfer-lab", "Transfer Lab"],
      ["/lunar-pole", "Lunar pole"],
    ],
  },
  {
    dimension: "Water, ice, permafrost and resources",
    status: "bounded",
    lab: "resources",
    categories: ["resources", "water_ice", "permafrost", "water_environment"],
    what: "POWER soil-wetness indices, Diviner ice-stability depth, documented permafrost and LCROSS references, and recovery scenarios.",
    measured: "The LCROSS Cabeus impact and a GTN-P permafrost borehole. These are references, not candidate cells.",
    modeled: "Soil-wetness indices and ice-stability depth. Neither measures ice.",
    unknown: "Resource abundance at any candidate.",
    where: [
      ["/cells", "Earth context"],
      ["/lunar-pole", "Lunar stability model"],
    ],
  },
  {
    dimension: "Dust, wind, erosion, atmospheric processes",
    status: "bounded",
    lab: "dust",
    what: "POWER wind, pressure and aerosol optical depth at 550 nm, with Shao–Lu and log-law grain-motion scenarios.",
    measured: "Column AOD and wind from reanalysis. AOD is not dust-specific.",
    modeled: "Threshold friction velocity for user-declared grain sizes and surface roughness.",
    unknown: "Surface grain size, deposition and entrainment at the site.",
    where: [["/transfer-lab", "Transfer Lab"]],
  },
  {
    dimension: "Biology, extremophiles, habitability, biosignatures",
    status: "bounded",
    lab: "biology",
    categories: ["biology", "biosignatures", "habitability"],
    what: "GBIF occurrence density for screened cells, published Salda and Yungay studies, and an assay-quality tool for blanks and controls.",
    measured: "The published reference-station studies.",
    modeled: "Assay quality from user replicates. GBIF counts reflect reporting effort, not life scarcity.",
    unknown: "Habitability or biosignature preservation at the candidates.",
    where: [
      ["/cells", "Reporting context"],
      ["/worlds", "Compare Worlds"],
    ],
  },
  {
    dimension: "Caves, lava tubes, subsurface",
    status: "bounded",
    lab: "caves",
    categories: ["caves", "subsurface"],
    what: "Documented NPS and USFS lava-tube references with relative survey stations, plus mapped soluble or volcanic host-rock context.",
    measured: "Locations and descriptions of documented caves from agency sources.",
    modeled: "Host-rock keyword context. The coarse 4 km terrain cannot detect entrances.",
    unknown: "Caves at the candidate cells.",
    where: [["/cells", "Mapped host context"]],
  },
  {
    dimension: "Landing, mobility, navigation, robotic and human operations",
    status: "bounded",
    lab: "operations",
    what: "Least-cost routes on 18 Copernicus 250 m lattices with slope limits, GeoJSON export, the operations lens, Froude scaling and field-study GPX.",
    measured: "Copernicus GLO-90 elevations with water and void masks.",
    modeled: "Routes under declared slope and cost limits.",
    unknown: "A hazard survey or traversability certification.",
    where: [
      ["/lenses", "Lenses"],
      ["/field-study", "Field study"],
    ],
  },
  {
    dimension: "Look beyond well-known analog sites",
    status: "covered",
    what: "Systematic search of 130 NASA POWER cells in four regions; mission-aware ranking finds cells absent from the dryness shortlist and one mapped-basalt lead within this sample. No first-ever discovery is claimed.",
    where: [
      ["/cells", "Search every cell"],
      ["/frontier", "Frontier"],
    ],
  },
  {
    dimension: "Explain what is analogous and what is not",
    status: "covered",
    what: "Separate fidelity, utility and coverage; Reality Gap; what Earth cannot reproduce; evidence inspector with sources and limits.",
    where: [
      ["/methodology", "Methodology"],
      ["/passport/saudi-24.000-39.375", "Passport"],
    ],
  },
  {
    dimension: "Permanent Moon-base locations",
    status: "bounded",
    lab: "base",
    what: "LOLA, Diviner and SPICE illumination models at IAU feature centres associated with NASA's October 2024 region list, with trade-off and autonomy scenarios.",
    measured: "LOLA topography and Diviner temperatures at the feature centres.",
    modeled: "Solar fraction, longest darkness and battery autonomy for user-declared loads.",
    unknown: "Landing polygons, engineering access and actual ice abundance.",
    where: [["/lunar-pole", "Lunar pole"]],
  },
  {
    dimension: "Earth's limits (gravity, vacuum, radiation)",
    status: "covered",
    what: "Stated on every dossier, the Transfer Lab and the guided demo.",
    where: [
      ["/transfer-lab", "Transfer Lab"],
      ["/demo?presentation=1", "Guided demo"],
    ],
  },
];
const DATA: [string, string, boolean][] = [
  ["NASA POWER (Earthdata)", "/methodology", true],
  ["NASA GIBS / Worldview imagery", "/explorer", true],
  ["NASA PDS: MOLA MEGDR, LOLA LDEM_16", "/terrain-pilot", true],
  ["NASA LRO LOLA at the lunar south pole", "/lunar-pole", true],
  ["ESA Copernicus DEM (GLO-90)", "/terrain-pilot", true],
  [
    "NASA LRO Diviner modeled polar thermal/stability products",
    "/lunar-pole",
    true,
  ],
  ["NASA NAIF SPICE kernels and JPL Horizons", "/research-lab?module=illumination", true],
  ["CSA RADARSAT / JAXA G-Portal", "", false],
];
const ICON = { covered: CheckCircle2, bounded: FlaskConical, gap: CircleSlash };
const LABEL = { covered: "Covered", bounded: "Bounded workflow", gap: "Not yet" };

export default function ChallengeFit() {
  const count = (s: Status) => DIMENSIONS.filter((d) => d.status === s).length;
  const data = useData(),
    hasRegistry = !!data.release?.files["challenge_evidence.json"];
  const evidence = useScienceFile(
    "challenge_evidence.json",
    challengeEvidenceSchema,
    "This pinned release has no evidence registry.",
    hasRegistry,
  );
  const references = (d: Dimension) =>
    evidence.value && d.categories
      ? evidence.value.records.filter((r) => r.categories.some((c) => d.categories!.includes(c))).length
      : null;
  return (
    <main className="document-page fit-page">
      <BackLink mission="jezero" />
      <header className="document-title">
        <div>
          <p className="document-label">2026 NASA Space Apps · challenge fit</p>
          <h1>What the challenge asks, and where TerrainX stands.</h1>
          <p>
            Suggested dimensions from “Identify Earth Locations that Analog the
            Permanent Moon Base Locations and Mars”, with evidence and limits.
            These are optional research avenues: the challenge accepts one or
            more useful analogs and does not require every dimension or partner
            dataset.
          </p>
        </div>
        <div className="fit-score" aria-label="Coverage summary">
          {(["covered", "bounded", "gap"] as Status[]).map((s) => (
            <span key={s} className={`fit-chip ${s}`}>
              <b className="mono">{count(s)}</b> {LABEL[s]}
            </span>
          ))}
        </div>
      </header>
      {!hasRegistry && (
        <p className="release-note">
          This pinned release predates the Research Lab evidence registry. Reference-record counts are hidden,
          and no newer evidence was substituted. The tools still open, but they report what is unavailable.
        </p>
      )}
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
              {d.status === "bounded" && (
                <dl className="fit-evidence">
                  <div className="measured">
                    <dt>Measured</dt>
                    <dd>{d.measured}</dd>
                  </div>
                  <div className="modeled">
                    <dt>Modeled</dt>
                    <dd>{d.modeled}</dd>
                  </div>
                  <div className="unknown">
                    <dt>Still unknown</dt>
                    <dd>{d.unknown}</dd>
                  </div>
                </dl>
              )}
              {d.lab && (
                <div className="fit-lab-row">
                  <Link className="fit-lab" to={`/research-lab?module=${d.lab}`}>
                    <FlaskConical size={14} aria-hidden="true" />
                    {LAB_MODULES.find((m) => m.id === d.lab)!.title} tool
                  </Link>
                  {references(d) ? (
                    <span className="fit-refs mono">
                      {references(d)} reference record{references(d) === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              )}
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
              {!used && <em>optional · not used</em>}
            </li>
          ))}
        </ul>
        <p className="caption">
          <a
            href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/"
            target="_blank"
            rel="noreferrer"
          >
            Challenge page <ExternalLink size={11} />
          </a>{" "}
          · Independent project; NASA data use does not imply endorsement.
        </p>
      </section>
    </main>
  );
}
