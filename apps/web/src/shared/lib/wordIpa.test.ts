import { describe, expect, it } from "vitest";
import {
  formatIpaDisplay,
  getDefinitionIpaPair,
  getSharedIpaUk,
  getSharedIpaUs,
  hasUniformIpaUk,
  hasUniformIpaUs,
} from "./wordIpa";

function makeDefinition(overrides: Partial<{ ipaUk: string | null; ipaUs: string | null }> = {}) {
  return {
    ipaUk: null,
    ipaUs: null,
    ...overrides,
  };
}

describe("wordIpa", () => {
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

  it("treats all-null ipa uk values as uniform", () => {
    expect(
      hasUniformIpaUk([
        makeDefinition() as never,
        makeDefinition() as never,
      ]),
    ).toBe(true);
  });

  it("returns true when all definitions share the same ipa uk", () => {
    expect(
      hasUniformIpaUk([
        makeDefinition({ ipaUk: "/əˈkaʊnt/" }) as never,
        makeDefinition({ ipaUk: "/əˈkaʊnt/", ipaUs: "/other/" }) as never,
      ]),
    ).toBe(true);
  });

  it("returns false when ipa uk differs across definitions", () => {
    expect(
      hasUniformIpaUk([
        makeDefinition({ ipaUk: "/riːd/" }) as never,
        makeDefinition({ ipaUk: "/rɛd/" }) as never,
      ]),
    ).toBe(false);
  });

  it("returns false when ipa us differs across definitions", () => {
    expect(
      hasUniformIpaUs([
        makeDefinition({ ipaUs: "/riːd/" }) as never,
        makeDefinition({ ipaUs: "/rɛd/" }) as never,
      ]),
    ).toBe(false);
  });

  it("allows uk uniform while us differs", () => {
    expect(
      hasUniformIpaUk([
        makeDefinition({ ipaUk: "/test/", ipaUs: "/uk/" }) as never,
        makeDefinition({ ipaUk: "/test/", ipaUs: "/us/" }) as never,
      ]),
    ).toBe(true);
    expect(
      hasUniformIpaUs([
        makeDefinition({ ipaUk: "/test/", ipaUs: "/uk/" }) as never,
        makeDefinition({ ipaUk: "/test/", ipaUs: "/us/" }) as never,
      ]),
    ).toBe(false);
  });

  it("returns shared ipa values from the first definition", () => {
    expect(
      getSharedIpaUk([
        makeDefinition({ ipaUk: "/uk/" }) as never,
        makeDefinition({ ipaUk: "/other/" }) as never,
      ]),
    ).toBe("/uk/");
    expect(
      getSharedIpaUs([
        makeDefinition({ ipaUs: "/us/" }) as never,
        makeDefinition({ ipaUs: "/other/" }) as never,
      ]),
    ).toBe("/us/");
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
