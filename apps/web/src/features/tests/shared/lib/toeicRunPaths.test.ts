import { describe, expect, it } from "vitest";
import {
  getExpandToeicRunPartsApiPath,
  getToeicRunApiPath,
  getToeicRunPath,
  parseToeicRunPartsParam,
} from "./toeicRunPaths";

describe("toeicRunPaths", () => {
  it("builds session-first run paths with normalized parts", () => {
    expect(getToeicRunPath("11111111-1111-4111-8111-111111111111", "practice", [2, 1]))
      .toBe("/tests/11111111-1111-4111-8111-111111111111/practice?parts=1,2");
    expect(
      getToeicRunPath("11111111-1111-4111-8111-111111111111", "mock_test", [3]),
    ).toBe("/tests/11111111-1111-4111-8111-111111111111/mock_test?parts=3");
  });

  it("builds API paths with parts and mode query params", () => {
    expect(
      getToeicRunApiPath("11111111-1111-4111-8111-111111111111", {
        parts: [1, 2],
        mode: "review_wrong",
      }),
    ).toBe(
      "/tests/runs/11111111-1111-4111-8111-111111111111?parts=1%2C2&mode=review_wrong",
    );
  });

  it("builds expand-parts API path", () => {
    expect(
      getExpandToeicRunPartsApiPath("11111111-1111-4111-8111-111111111111"),
    ).toBe(
      "/tests/runs/11111111-1111-4111-8111-111111111111/expand-parts",
    );
  });

  it("parses parts query params", () => {
    expect(parseToeicRunPartsParam("2,1")).toEqual([1, 2]);
    expect(parseToeicRunPartsParam("")).toEqual([]);
    expect(parseToeicRunPartsParam("abc")).toEqual([]);
  });
});
