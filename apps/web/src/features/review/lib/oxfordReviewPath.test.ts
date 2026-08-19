import { describe, expect, it } from "vitest";
import {
  getOxfordReviewLegacyPathRedirect,
  getOxfordReviewPath,
  getOxfordReviewPathRedirectTarget,
} from "./oxfordReviewPath";

describe("oxfordReviewPath", () => {
  it("builds review query URLs", () => {
    expect(getOxfordReviewPath("A2", 1)).toBe(
      "/review/oxford?band=A2&group=1",
    );
  });

  it("redirects missing or invalid review query params", () => {
    expect(getOxfordReviewPathRedirectTarget(new URLSearchParams())).toBe(
      "/review/oxford?band=A1&group=1",
    );
    expect(
      getOxfordReviewPathRedirectTarget(new URLSearchParams("band=A2")),
    ).toBe("/review/oxford?band=A2&group=1");
    expect(
      getOxfordReviewPathRedirectTarget(
        new URLSearchParams("band=A2&group=3"),
      ),
    ).toBeNull();
  });

  it("maps legacy path segments onto the review query URL", () => {
    expect(getOxfordReviewLegacyPathRedirect("A2", "part-1")).toBe(
      "/review/oxford?band=A2&group=1",
    );
    expect(getOxfordReviewLegacyPathRedirect("A2")).toBe(
      "/review/oxford?band=A2&group=1",
    );
  });
});
