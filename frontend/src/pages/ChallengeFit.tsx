import { Link, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import { BackLink } from "../components/ui";
import { useData } from "../lib/data";
import { studyPath } from "../lib/collections";
import type { LabModule } from "../lib/researchLab";

type Status = "covered" | "partial" | "gap" | "implemented";
/** Suggested challenge dimensions; these are optional avenues, not a compliance checklist. */
const DIMENSIONS: {
  dimension: string;
  status: Status;
  what: string;
  where: [string, string][];
  lab?: LabModule;
  implementedWhat?: string;
}[] = [
  {
    dimension: "Geology, mineralogy and surface materials",
    lab: "mineralogy",
    implementedWhat:
      "Mapped cell context plus source-scoped laboratory XRD/phase evidence at Salda and Yungay, composition-closure checks and a georeferenced mineral-sampling protocol. Specimen evidence is not transferred to untested outcrops.",
    status: "partial",
    what: "Macrostrat mapped context for129/130 cells and19/20 released sites; basalt / sedimentary relevance per mission. Mapped regional units, not mineralogy.",
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
    lab: "illumination",
    implementedWhat:
      "Actual2025 POWER daily air-temperature envelopes at18sites; Earth solar geometry;8 lunar feature-centre SPICE/LOLA illumination series. Different observables/supports remain separate; one year and a coarse horizon do not establish permanent illumination.",
    status: "partial",
    what: "NASA POWER air climatology for all130 cells and Diviner model-derived lunar thermal summaries. These are different observables; no illumination model or exact thermal analog claim.",
    where: [["/transfer-lab", "Transfer Lab"]],
  },
  {
    dimension: "Water, ice, permafrost and resources",
    lab: "resources",
    implementedWhat:
      "LCROSS water retrieval and GTN-P borehole temperature references, alongside existing wetness/stability models. Recovery mass-balance scenarios and a resource-verification protocol. No reserve or remote abundance is assigned to another site.",
    status: "partial",
    what: "POWER modeled soil-wetness indices and Diviner modeled ice-stability depth. Neither is a measurement of water ice; permafrost, abundance and field resources remain unassessed.",
    where: [
      ["/cells", "Earth context"],
      ["/lunar-pole", "Lunar stability model"],
    ],
  },
  {
    dimension: "Dust, wind, erosion, atmospheric processes",
    lab: "dust",
    implementedWhat:
      "POWER-derived air density, Shao–Lu grain-initiation thresholds and declared wind-profile/cohesion scenarios. Controls expose model sensitivity and required grain/shear measurements; AOD is not a dust composition or storm forecast.",
    status: "partial",
    what: "POWER wind/pressure and column aerosol optical depth550nm. AOD is not dust-specific composition, surface deposition or a dust-entrainment model.",
    where: [["/transfer-lab", "Transfer Lab"]],
  },
  {
    dimension: "Biology, extremophiles, habitability, biosignatures",
    lab: "biology",
    implementedWhat:
      "Source-scoped Salda/Yungay microscopy and assays; blank/replicate/positive-control signal analysis; contamination-aware sampling protocol. Incubation counts and GBIF reporting remain distinct from in-situ biomass or habitability.",
    status: "partial",
    what: "GBIF recorded occurrence density for screened cells plus cited Salda/Yungay studies. Counts reflect reporting and sampling; no inference of life scarcity, sterility, habitability or biosignature preservation.",
    where: [
      ["/cells", "Reporting context"],
      ["/worlds", "Compare Worlds"],
    ],
  },
  {
    dimension: "Caves, lava tubes, subsurface",
    lab: "caves",
    implementedWhat:
      "Three agency-documented lava-tube references, published dimensions where available, relative sensor-station plans and survey protocols. No unverified entrance coordinate, roof-stability claim or cave detection at a screened cell is invented.",
    status: "partial",
    what: "Mapped soluble/volcanic host-rock keyword context. No verified cave or lava-tube inventory; coarse4km terrain cannot detect entrances or subsurface geometry.",
    where: [["/cells", "Mapped host context"]],
  },
  {
    dimension: "Landing, mobility, navigation, robotic and human operations",
    lab: "operations",
    implementedWhat:
      "Actual97×97 Copernicus250m analysis lattices at18sites plus honest coarse SRTM fallback; constrained least-cost routes, proposed GeoJSON and navigation/survey protocols. No landing hazard clearance or wheel-soil certification.",
    status: "partial",
    what: "Operations-rehearsal lens, Froude scaling, slope forces, field-study traverses and GPX. Not a hazard or traversability survey.",
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
    lab: "base",
    implementedWhat:
      "MOON_ME solar geometry, bounded LOLA horizons and separate Diviner stability context at8 feature centres; adjustable sunlight/terrain trade-offs and outage-autonomy experiments. Not landing polygons, permanent illumination, measured reserves or base certification.",
    status: "partial",
    what: "LOLA and Diviner models at IAU feature centres associated with NASA's October2024 region list. Feature centres are not landing polygons; illumination, engineering access and actual ice abundance remain unassessed.",
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
  ["CSA RADARSAT / JAXA G-Portal", "", false],
];
const ICON = {
  covered: CheckCircle2,
  partial: CircleDashed,
  gap: CircleSlash,
  implemented: FlaskConical,
};
const LABEL = {
  covered: "Covered",
  partial: "Partial",
  gap: "Not yet",
  implemented: "Tool ready",
};

export default function ChallengeFit() {
  const data = useData(),
    { search } = useLocation(),
    ready = !!data.release?.files["challenge_evidence.json"];
  const status = (d: (typeof DIMENSIONS)[number]): Status =>
    ready && d.lab ? "implemented" : d.status;
  const count = (s: Status) => DIMENSIONS.filter((d) => status(d) === s).length;
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
          {(
            ["covered", ready ? "implemented" : "partial", "gap"] as Status[]
          ).map((s) => (
            <span key={s} className={`fit-chip ${s}`}>
              <b className="mono">{count(s)}</b> {LABEL[s]}
            </span>
          ))}
        </div>
      </header>
      {ready && (
        <p className="scientific-caveat fit-implementation-note">
          All eight formerly partial areas now have functioning research tools
          and field-protocol handoffs. “Tool ready” describes the
          implementation; evidence remains source-scoped and
          field/resource/engineering validation is still explicit. No score or
          scientific claim was upgraded just to change a badge.
        </p>
      )}
      <section className="fit-grid">
        {DIMENSIONS.map((d) => {
          const state = status(d),
            Icon = ICON[state];
          return (
            <article key={d.dimension} className={`fit-card ${state}`}>
              <header>
                <Icon size={18} aria-hidden="true" />
                <h2>{d.dimension}</h2>
                <span className="fit-tag">{LABEL[state]}</span>
              </header>
              <p>{ready ? (d.implementedWhat ?? d.what) : d.what}</p>
              {ready && d.lab && (
                <Link
                  className="fit-lab-link"
                  to={studyPath(
                    `/research-lab?module=${d.lab}&cohort=expanded&polar=none${d.lab === "base" ? "&mission=mare-crisium" : ""}`,
                    search,
                  )}
                >
                  Resolve this research gap
                  <FlaskConical size={13} />
                </Link>
              )}
              {d.where.length > 0 && (
                <nav aria-label={`Where: ${d.dimension}`}>
                  {d.where.map(([to, label]) => (
                    <Link key={to} to={studyPath(to, search)}>
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
