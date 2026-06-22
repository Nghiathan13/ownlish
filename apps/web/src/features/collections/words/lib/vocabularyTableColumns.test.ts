import { describe, expect, it } from "vitest";
import {
  createDefaultColumnVisibility,
  parseColumnVisibility,
  toggleColumnVisibility,
} from "./vocabularyTableColumns";

describe("vocabularyTableColumns", () => {
  it("creates default visibility with all columns enabled", () => {
    expect(createDefaultColumnVisibility()).toEqual({
      ipaUk: true,
      ipaUs: true,
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

  it("migrates legacy ipa key to ipaUk and ipaUs", () => {
    expect(
      parseColumnVisibility(
        JSON.stringify({
          ipa: false,
        }),
      ),
    ).toEqual({
      ...createDefaultColumnVisibility(),
      ipaUk: false,
      ipaUs: false,
    });
  });

  it("toggles a single column", () => {
    const visibility = createDefaultColumnVisibility();

    expect(toggleColumnVisibility(visibility, "ipaUk")).toEqual({
      ...visibility,
      ipaUk: false,
    });
  });
});
