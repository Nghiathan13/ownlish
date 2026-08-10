import { describe, expect, it } from "vitest";
import {
  getPartProgress,
  getTestCorrectCount,
  getTestWrongCount,
} from "./toeicTestProgress";

const test = {
  catalog: {
    id: "ets-2026-1",
    series: "ETS",
    year: 2026,
    testNumber: 1,
    complete: true,
    parts: [],
  },
  totalQuestions: 3,
  parts: [
    { partNumber: 1, partCorrectCount: 1, partWrongCount: 0 },
    { partNumber: 2, partCorrectCount: 1, partWrongCount: 1 },
  ],
};

describe("TOEIC test progress helpers", () => {
  it("finds one part or returns null for missing test and part", () => {
    expect(getPartProgress(test, 2)).toEqual(test.parts[1]);
    expect(getPartProgress(test, 7)).toBeNull();
    expect(getPartProgress(null, 1)).toBeNull();
  });

  it("adds correct and wrong counts across parts", () => {
    expect(getTestCorrectCount(test)).toBe(2);
    expect(getTestWrongCount(test)).toBe(1);
  });
});
