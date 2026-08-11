import { describe, expect, it } from "vitest";
import {
  getToeicRunPath,
  parseToeicRunPartsParam,
  parseToeicRunTestKeyParam,
} from "./toeicRunPaths";

describe("toeicRunPaths", () => {
  it("builds session-first run paths with normalized parts", () => {
    expect(getToeicRunPath("11111111-1111-4111-8111-111111111111", "practice", [2, 1]))
      .toBe("/tests/11111111-1111-4111-8111-111111111111/practice?parts=1,2");
    expect(
      getToeicRunPath("11111111-1111-4111-8111-111111111111", "mock_test", [3]),
    ).toBe("/tests/11111111-1111-4111-8111-111111111111/mock_test?parts=3");
    expect(
      getToeicRunPath(
        "11111111-1111-4111-8111-111111111111",
        "practice",
        [1],
        "ets26-t01",
      ),
    ).toBe(
      "/tests/11111111-1111-4111-8111-111111111111/practice?parts=1&test=ets26-t01",
    );
  });

  it("parses parts query params", () => {
    expect(parseToeicRunPartsParam("2,1")).toEqual([1, 2]);
    expect(parseToeicRunPartsParam("")).toEqual([]);
    expect(parseToeicRunPartsParam("abc")).toEqual([]);
    expect(parseToeicRunTestKeyParam("ets26-t01")).toBe("ets26-t01");
    expect(parseToeicRunTestKeyParam("")).toBeNull();
  });
});
