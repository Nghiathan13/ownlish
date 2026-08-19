import { describe, expect, it } from "vitest";
import {
  getReviewCategoryPath,
  getReviewLocation,
  getReviewLocationPath,
} from "./reviewPaths";

describe("reviewPaths", () => {
  it("parses Oxford review routes and defaults other paths to the user queue", () => {
    expect(getReviewLocation("/review/oxford/A1/part-1")).toEqual({
      band: "A1",
      category: "oxford",
      part: "part-1",
    });
    expect(getReviewLocation("/review")).toEqual({
      band: "A1",
      category: "user",
      part: "part-1",
    });
    expect(getReviewLocation("/review/oxford/A1")).toEqual({
      band: "A1",
      category: "user",
      part: "part-1",
    });
  });

  it("maps locations back to review routes", () => {
    expect(
      getReviewLocationPath({
        band: "B1",
        category: "oxford",
        part: "part-2",
      }),
    ).toBe("/review/oxford/B1/part-2");
    expect(
      getReviewLocationPath({
        band: "A1",
        category: "user",
        part: "part-1",
      }),
    ).toBe("/review");
  });

  it("maps category tabs to the default review routes", () => {
    expect(getReviewCategoryPath("user")).toBe("/review");
    expect(getReviewCategoryPath("oxford")).toBe("/review/oxford/A1/part-1");
  });
});
