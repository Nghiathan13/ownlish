import { describe, expect, it } from "vitest";
import { parseEvidenceHighlightEnabled } from "./evidenceHighlightStorage";

describe("parseEvidenceHighlightEnabled", () => {
  it("defaults to enabled", () => {
    expect(parseEvidenceHighlightEnabled(null)).toBe(true);
    expect(parseEvidenceHighlightEnabled("true")).toBe(true);
  });

  it("returns disabled only for false", () => {
    expect(parseEvidenceHighlightEnabled("false")).toBe(false);
  });
});
