import { describe, expect, it } from "vitest";
import {
  getReviewCategoryPath,
  getReviewLocation,
  getReviewLocationPath,
} from "./reviewPaths";

describe("reviewPaths", () => {
  it("parses Oxford review query routes and defaults other paths to the user queue", () => {
    expect(
      getReviewLocation(
        "/review/oxford",
        new URLSearchParams("band=A1&group=1"),
      ),
    ).toEqual({
      band: "A1",
      category: "oxford",
      group: 1,
    });
    expect(getReviewLocation("/review")).toEqual({
      band: "A1",
      category: "user",
      group: 1,
    });
    expect(getReviewLocation("/review/oxford/A1")).toEqual({
      band: "A1",
      category: "user",
      group: 1,
    });
  });

  it("maps locations back to review routes", () => {
    expect(
      getReviewLocationPath({
        band: "B1",
        category: "oxford",
        group: 2,
      }),
    ).toBe("/review/oxford?band=B1&group=2");
    expect(
      getReviewLocationPath({
        band: "A1",
        category: "user",
        group: 1,
      }),
    ).toBe("/review");
  });

  it("maps category tabs to the default review routes", () => {
    expect(getReviewCategoryPath("user")).toBe("/review");
    expect(getReviewCategoryPath("oxford")).toBe(
      "/review/oxford?band=A1&group=1",
    );
  });
});
