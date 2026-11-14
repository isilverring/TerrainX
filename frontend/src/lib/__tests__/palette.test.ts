import { describe, expect, it } from "vitest";
import { matchScore } from "../../components/CommandPalette";
describe("command palette matching", () => {
  it("prefers contiguous, earlier matches and rejects absent characters", () => {
    expect(matchScore("", "anything")).toBe(0);
    expect(matchScore("gobi", "Gobi region · 01")).toBeGreaterThan(matchScore("gobi", "Field study Gobi"));
    expect(matchScore("fsb", "Field Study Builder")).toBeGreaterThan(0);
    expect(matchScore("xyz", "Field Study Builder")).toBe(-1);
    expect(matchScore("saudi 02", "western saudi arabia · 02")).toBeGreaterThan(0);
  });
});
