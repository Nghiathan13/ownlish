import { describe, expect, it } from "vitest";
import {
  getOxfordGroupRange,
  getOxfordLegacyPathRedirect,
  getOxfordPath,
  getOxfordPathRedirectTarget,
  parseOxfordBand,
  parseOxfordGroup,
  parseOxfordGroupParam,
} from "./oxfordNavigation";

describe("oxfordNavigation", () => {
  it("builds query URLs for band and group", () => {
    expect(getOxfordPath("A1")).toBe("/collections/oxford?band=A1");
    expect(getOxfordPath("A1", 3)).toBe("/collections/oxford?band=A1&group=3");
  });

  it("splits the final A1 group to its remaining words", () => {
    expect(getOxfordGroupRange(48, 957)).toEqual({
      end: 957,
      label: "941–957",
      offset: 940,
      wordCount: 17,
    });
  });

  it("accepts only supported bands and positive group numbers", () => {
    expect(parseOxfordBand("B2")).toBe("B2");
    expect(parseOxfordBand("C2")).toBeNull();
    expect(parseOxfordGroup("part-1")).toBe(1);
    expect(parseOxfordGroup("1")).toBe(1);
    expect(parseOxfordGroup("part-0")).toBeNull();
    expect(parseOxfordGroup("0")).toBeNull();
    expect(parseOxfordGroup("1.5")).toBeNull();
    expect(parseOxfordGroupParam("3")).toBe(3);
    expect(parseOxfordGroupParam("part-3")).toBeNull();
    expect(parseOxfordGroupParam("0")).toBeNull();
  });

  it("redirects missing or invalid query params to the canonical Oxford URL", () => {
    expect(getOxfordPathRedirectTarget(new URLSearchParams())).toBe(
      "/collections/oxford?band=A1",
    );
    expect(
      getOxfordPathRedirectTarget(new URLSearchParams("band=nope")),
    ).toBe("/collections/oxford?band=A1");
    expect(
      getOxfordPathRedirectTarget(new URLSearchParams("band=A2&group=nope")),
    ).toBe("/collections/oxford?band=A2");
    expect(
      getOxfordPathRedirectTarget(new URLSearchParams("band=A2&group=3")),
    ).toBeNull();
  });

  it("maps legacy path segments onto the query URL", () => {
    expect(getOxfordLegacyPathRedirect("A2", "part-3")).toBe(
      "/collections/oxford?band=A2&group=3",
    );
    expect(getOxfordLegacyPathRedirect("A2", "3")).toBe(
      "/collections/oxford?band=A2&group=3",
    );
    expect(getOxfordLegacyPathRedirect("A2")).toBe(
      "/collections/oxford?band=A2",
    );
    expect(getOxfordLegacyPathRedirect("nope", "part-1")).toBe(
      "/collections/oxford?band=A1&group=1",
    );
  });
});
