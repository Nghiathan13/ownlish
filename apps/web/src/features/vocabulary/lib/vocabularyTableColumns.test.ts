import { describe, expect, it } from "vitest";
import {
  createDefaultColumnVisibility,
  parseColumnVisibility,
  toggleColumnVisibility,
} from "./vocabularyTableColumns";

describe("vocabularyTableColumns", () => {
  it("creates default visibility with all columns enabled", () => {
    expect(createDefaultColumnVisibility()).toEqual({
      ipa: true,
      type: true,
      meaning: true,
      level: true,
      example: true,
      nextReview: true,
    });
  });

  it("returns default visibility for invalid json", () => {
    expect(parseColumnVisibility("{not-json")).toEqual(
      createDefaultColumnVisibility(),
    );
  });

  it("merges partial visibility and ignores unknown keys", () => {
    expect(
      parseColumnVisibility(
        JSON.stringify({
          meaning: false,
          unknown: false,
        }),
      ),
    ).toEqual({
      ...createDefaultColumnVisibility(),
      meaning: false,
    });
  });

  it("ignores legacy word key from stored visibility", () => {
    expect(
      parseColumnVisibility(
        JSON.stringify({
          word: false,
          meaning: false,
        }),
      ),
    ).toEqual({
      ...createDefaultColumnVisibility(),
      meaning: false,
    });
  });

  it("toggles a single column", () => {
    const visibility = createDefaultColumnVisibility();

    expect(toggleColumnVisibility(visibility, "ipa")).toEqual({
      ...visibility,
      ipa: false,
    });
  });
});
