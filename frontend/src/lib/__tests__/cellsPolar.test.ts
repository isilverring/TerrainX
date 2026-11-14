import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cellLabel, cellSearchSchema } from "../cellSearch";
import { lunarPolarSchema, polarXY } from "../lunarPolar";

const read = (f: string) => JSON.parse(readFileSync(resolve(__dirname, "../../../public/data", f), "utf8"));
describe("cell search and lunar pole data", () => {
  it("validate against their schemas and keep released discovery rules", () => {
    const s = cellSearchSchema.parse(read("cell_search.json"));
    expect(s.rows).toHaveLength(130);
    for (const r of s.rows) for (const m of Object.values(r.missions)) if (m.criteria.geology == null) expect(m.rank).toBeNull();
    const p = lunarPolarSchema.parse(read("lunar_polar.json"));
    expect(p.raster.sha256).toBe(p.raster.pinned_sha256);
    expect(p.sites.filter((x) => x.artemis_region)).toHaveLength(7);
  });
  it("projects the south pole with 0° up and east clockwise", () => {
    const up = polarXY(-85, 0, 100, 10), east = polarXY(-85, 90, 100, 10), pole = polarXY(-90, 45, 100, 10);
    expect(up.x).toBeCloseTo(0, 9);
    expect(up.y).toBeCloseTo(-50, 9);
    expect(east.x).toBeCloseTo(50, 9);
    expect(Math.hypot(pole.x, pole.y)).toBeCloseTo(0, 9);
    expect(cellLabel({ latitude: -23, longitude: -70 })).toBe("23.00°S 70.000°W");
  });
});
