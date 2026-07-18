import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTestPracticeGroupKeys,
  getTestPracticeGroupStorageKey,
  readTestPracticeGroupKey,
  writeTestPracticeGroupKey,
} from "./testPracticePosition";

describe("test practice position", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps only the current group key per test, mode, and selected parts", () => {
    expect(getTestPracticeGroupStorageKey("ets26-t01", "practice", [3, 1]))
      .toBe("engvocab.practiceRun.group.ets26-t01.practice.1,3");

    writeTestPracticeGroupKey(
      "ets26-t01",
      "practice",
      [1, 3],
      "ets26-t01-p3-g032-034",
    );

    expect(readTestPracticeGroupKey("ets26-t01", "practice", [3, 1]))
      .toBe("ets26-t01-p3-g032-034");
  });

  it("clears every saved position for a reset test", () => {
    writeTestPracticeGroupKey("ets26-t01", "practice", [1], "ets26-t01-p1-q001");
    writeTestPracticeGroupKey("ets26-t01", "review_wrong", [3], "ets26-t01-p3-g032-034");
    writeTestPracticeGroupKey("ets26-t02", "practice", [1], "ets26-t02-p1-q001");

    clearTestPracticeGroupKeys("ets26-t01");

    expect(readTestPracticeGroupKey("ets26-t01", "practice", [1])).toBeNull();
    expect(readTestPracticeGroupKey("ets26-t01", "review_wrong", [3])).toBeNull();
    expect(readTestPracticeGroupKey("ets26-t02", "practice", [1]))
      .toBe("ets26-t02-p1-q001");
  });
});
