import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPartPracticeGroupKeys,
  getPartPracticePositionStorageKey,
  readPartPracticeGroupKey,
  writePartPracticeGroupKey,
} from "./partPracticePosition";

describe("part practice position storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores one group key for each mode and part", () => {
    writePartPracticeGroupKey(3, "practice", "ets26-t01-p3-g032-034");

    expect(getPartPracticePositionStorageKey(3, "practice")).toBe(
      "engvocab:part-practice:practice:part:3",
    );
    expect(readPartPracticeGroupKey(3, "practice")).toBe(
      "ets26-t01-p3-g032-034",
    );
    expect(readPartPracticeGroupKey(3, "review_wrong")).toBeNull();
  });

  it("clears both practice modes for a reset part", () => {
    writePartPracticeGroupKey(3, "practice", "ets26-t01-p3-g032-034");
    writePartPracticeGroupKey(3, "review_wrong", "ets26-t01-p3-g035-037");

    clearPartPracticeGroupKeys(3);

    expect(readPartPracticeGroupKey(3, "practice")).toBeNull();
    expect(readPartPracticeGroupKey(3, "review_wrong")).toBeNull();
  });
});
