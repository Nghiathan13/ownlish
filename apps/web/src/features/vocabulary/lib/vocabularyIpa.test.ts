import { describe, expect, it } from "vitest";
import {
  formatIpaDisplay,
  getDefinitionIpaPair,
  getSharedIpaPair,
  hasUniformIpa,
} from "./vocabularyIpa";

function makeDefinition(overrides: Partial<{ ipaUk: string | null; ipaUs: string | null }> = {}) {
  return {
    ipaUk: null,
    ipaUs: null,
    ...overrides,
  };
}

describe("vocabularyIpa", () => {
  it("returns ipa pair from definition", () => {
    expect(
      getDefinitionIpaPair(
        makeDefinition({
          ipaUk: "/uk/",
          ipaUs: "/us/",
        }) as never,
      ),
    ).toEqual({
      uk: "/uk/",
      us: "/us/",
    });
  });

  it("treats all-null definitions as uniform", () => {
    expect(
      hasUniformIpa([
        makeDefinition() as never,
        makeDefinition() as never,
      ]),
    ).toBe(true);
  });

  it("returns true when all definitions share the same ipa pair", () => {
    expect(
      hasUniformIpa([
        makeDefinition({ ipaUk: "/əˈkaʊnt/", ipaUs: "/əˈkaʊnt/" }) as never,
        makeDefinition({ ipaUk: "/əˈkaʊnt/", ipaUs: "/əˈkaʊnt/" }) as never,
      ]),
    ).toBe(true);
  });

  it("returns false when ipaUk differs across definitions", () => {
    expect(
      hasUniformIpa([
        makeDefinition({ ipaUk: "/riːd/", ipaUs: "/riːd/" }) as never,
        makeDefinition({ ipaUk: "/rɛd/", ipaUs: "/rɛd/" }) as never,
      ]),
    ).toBe(false);
  });

  it("returns false when only one definition has ipaUs", () => {
    expect(
      hasUniformIpa([
        makeDefinition({ ipaUk: "/test/", ipaUs: null }) as never,
        makeDefinition({ ipaUk: "/test/", ipaUs: "/test/" }) as never,
      ]),
    ).toBe(false);
  });

  it("returns shared ipa pair from the first definition", () => {
    expect(
      getSharedIpaPair([
        makeDefinition({ ipaUk: "/uk/", ipaUs: "/us/" }) as never,
        makeDefinition({ ipaUk: "/other/", ipaUs: "/other/" }) as never,
      ]),
    ).toEqual({
      uk: "/uk/",
      us: "/us/",
    });
  });

  it("returns null pair when definitions are empty", () => {
    expect(getSharedIpaPair([])).toEqual({
      uk: null,
      us: null,
    });
  });
});

describe("formatIpaDisplay", () => {
  it("wraps ipa value with slashes", () => {
    expect(formatIpaDisplay("əˈkaʊnt")).toBe("/əˈkaʊnt/");
  });

  it("normalizes values that already include slashes", () => {
    expect(formatIpaDisplay("/əˈkaʊnt/")).toBe("/əˈkaʊnt/");
  });
});
