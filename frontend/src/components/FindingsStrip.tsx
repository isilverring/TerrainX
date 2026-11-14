import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useScienceFile } from "../lib/scienceFile";
import { cellLabel, cellSearchSchema } from "../lib/cellSearch";
import { lunarPolarSchema } from "../lib/lunarPolar";

/** Three live findings read from the pinned science release (nothing hard-coded). */
export default function FindingsStrip() {
  const cells = useScienceFile("cell_search.json", cellSearchSchema, "absent").value;
  const polar = useScienceFile("lunar_polar.json", lunarPolarSchema, "absent").value;
  if (!cells || !polar) return null;
  const moon = cells.rows.find((r) => r.missions["mare-crisium"].rank === 1);
  const mars = cells.missions.jezero;
  const twins = polar.sites
    .filter((s) => s.artemis_region && s.earth_twins?.length)
    .sort((a, b) => b.earth_twins![0].F - a.earth_twins![0].F);
  const best = twins[0];
  const cards = [
    moon && {
      to: "/cells?mission=mare-crisium",
      kicker: "New · Moon",
      title: "First lunar-eligible Earth cell",
      body: `${cellLabel(moon)} maps as “${moon.geology.unit_name}”. P ${moon.missions["mare-crisium"].P?.toFixed(1)}, a lead for field verification.`,
    },
    {
      to: "/cells?mission=jezero",
      kicker: "New · Mars",
      title: `${mars.new_vs_release.length} of ${mars.shortlist.length} picks change`,
      body: `Ranking all ${cells.cells} cells for the mission, not just dryness, keeps only ${mars.overlap_with_release.length} of the original shortlist.`,
    },
    best && {
      to: "/lunar-pole",
      kicker: "New · Lunar south pole",
      title: `${best.feature}: Earth relief twin F ${best.earth_twins![0].F.toFixed(0)}`,
      body: "Checksum-verified LOLA terrain at Artemis III region features; steep massifs find no Earth twin.",
    },
  ].filter(Boolean) as { to: string; kicker: string; title: string; body: string }[];
  return (
    <section className="findings-strip" aria-label="Latest findings">
      {cards.map((c) => (
        <Link key={c.to} to={c.to} className="finding-card">
          <span className="document-label">{c.kicker}</span>
          <strong>{c.title}</strong>
          <span>{c.body}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ))}
    </section>
  );
}
