import { describe, expect, it } from "vitest";
import { parseBilingualEnabled } from "./bilingualStorage";

describe("parseBilingualEnabled", () => {
  it("defaults to disabled", () => {
    expect(parseBilingualEnabled(null)).toBe(false);
    expect(parseBilingualEnabled("false")).toBe(false);
  });

  it("returns enabled only for true", () => {
    expect(parseBilingualEnabled("true")).toBe(true);
  });
});
