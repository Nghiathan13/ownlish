import { describe, expect, it } from "vitest";
import { getReviewIntervalLabel } from "./reviewSchedule";

describe("getReviewIntervalLabel", () => {
  it("matches the shared rating schedule", () => {
    expect(getReviewIntervalLabel(0, "FORGET")).toBe("2h");
    expect(getReviewIntervalLabel(0, "HARD")).toBe("5h");
    expect(getReviewIntervalLabel(2, "GOOD")).toBe("2d");
    expect(getReviewIntervalLabel(2, "EASY")).toBe("7d");
  });

  it("shows mastered for the final Easy rating", () => {
    expect(getReviewIntervalLabel(6, "EASY")).toBe("∞");
  });
});
