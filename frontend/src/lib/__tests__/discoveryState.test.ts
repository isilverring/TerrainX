import { describe, expect, it } from "vitest";
import {
  comparisonIds,
  discoveryFilters,
  resetDiscoveryFilters,
} from "../discoveryState";
import { studyPath } from "../collections";

describe("Discovery workflow state", () => {
  it("replays valid filter choices from a shared URL", () => {
    expect(
      discoveryFilters(
        new URLSearchParams(
          "atlas_region=gobi&atlas_q=basalt&atlas_coverage=70&atlas_sort=F",
        ),
        ["gobi"],
      ),
    ).toEqual({
      region: "gobi",
      query: "basalt",
      sufficient: true,
      sortKey: "F",
    });
  });
  it("rejects unsupported regions and sort choices", () => {
    expect(
      discoveryFilters(
        new URLSearchParams("atlas_region=elsewhere&atlas_sort=winner"),
        ["gobi"],
      ),
    ).toEqual({ region: "all", query: "", sufficient: false, sortKey: "U" });
  });
  it("comparison picks are unique, collection-safe and bounded", () => {
    expect(comparisonIds("a,a,unknown,b,c,d", ["a", "b", "c", "d"])).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(comparisonIds("a,b", ["b"])).toEqual(["b"]);
  });
  it("resets only filters and keeps the selected site, comparison and science context", () => {
    const p = resetDiscoveryFilters(
      new URLSearchParams(
        "atlas_region=gobi&atlas_q=x&atlas_coverage=70&atlas_id=a&atlas_compare=a,b&science=v1&polar=haworth",
      ),
    );
    expect(p.has("atlas_q")).toBe(false);
    expect(p.get("atlas_id")).toBe("a");
    expect(p.get("atlas_compare")).toBe("a,b");
    expect(p.get("science")).toBe("v1");
    expect(p.get("polar")).toBe("haworth");
  });
  it("keeps atlas context through a dossier without leaking another page's filters", () => {
    const path = studyPath(
      "/site/a?mission=jezero",
      "?cohort=expanded&science=v1&atlas_q=gobi&atlas_id=a&atlas_compare=a,b&region=other",
    );
    expect(path).toContain("atlas_q=gobi");
    expect(path).toContain("cohort=expanded");
    expect(path).not.toContain("region=other");
  });
});
