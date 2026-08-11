import { describe, expect, it } from "vitest";
import {
  createDefaultCatalogColumnVisibility,
  getCatalogTableColumnCount,
  isCatalogColumnVisible,
  parseCatalogColumnVisibility,
  toggleCatalogColumnVisibility,
} from "./catalogTableColumns";

describe("catalog table column visibility", () => {
  it("uses the intended defaults for optional catalog columns", () => {
    expect(createDefaultCatalogColumnVisibility()).toEqual({
      ipaUk: true,
      ipaUs: false,
      type: true,
      band: false,
      meaning: true,
      example: true,
    });
  });

  it("falls back to defaults for missing, malformed, and invalid saved values", () => {
    const defaults = createDefaultCatalogColumnVisibility();

    expect(parseCatalogColumnVisibility(null)).toEqual(defaults);
    expect(parseCatalogColumnVisibility("not-json")).toEqual(defaults);
    expect(parseCatalogColumnVisibility('[]')).toEqual(defaults);
  });

  it("restores supported saved settings and supports legacy ipa preference", () => {
    const visibility = parseCatalogColumnVisibility(
      JSON.stringify({ ipa: false, band: true, example: "yes", unknown: true }),
    );

    expect(visibility.ipaUk).toBe(false);
    expect(visibility.ipaUs).toBe(false);
    expect(visibility.band).toBe(true);
    expect(visibility.example).toBe(true);
  });

  it("toggles a column and calculates the rendered table count", () => {
    const defaults = createDefaultCatalogColumnVisibility();
    const toggled = toggleCatalogColumnVisibility(defaults, "ipaUs");

    expect(isCatalogColumnVisible(toggled, "ipaUs")).toBe(true);
    expect(getCatalogTableColumnCount(defaults)).toBe(6);
    expect(getCatalogTableColumnCount(toggled)).toBe(7);
  });
});
