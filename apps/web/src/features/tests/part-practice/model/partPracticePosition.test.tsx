import { beforeEach, describe, expect, it } from "vitest";
import {
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
});
