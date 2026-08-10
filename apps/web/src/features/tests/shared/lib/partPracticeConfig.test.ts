import { describe, expect, it } from "vitest";
import { getPartPracticeConfig, isSupportedPracticePart } from "./partPracticeConfig";

describe("part practice configuration", () => {
  it("returns configured values for supported parts", () => {
    expect(getPartPracticeConfig(1).leftPanel).toBe("audio-image");
    expect(getPartPracticeConfig(7).navigationMode).toBe("per-group");
  });

  it("returns the question fallback for unknown parts", () => {
    expect(getPartPracticeConfig(99)).toEqual({
      leftPanel: "question",
      translationVariant: "question-options",
      showQuestionInRightPanel: true,
      navigationMode: "per-question",
      showOptionTextBeforeAnswer: false,
      hideContextUntilGroupComplete: false,
      contentLayout: "default",
    });
  });

  it("accepts only parts one through seven", () => {
    expect(isSupportedPracticePart(1)).toBe(true);
    expect(isSupportedPracticePart(7)).toBe(true);
    expect(isSupportedPracticePart(0)).toBe(false);
    expect(isSupportedPracticePart(8)).toBe(false);
  });
});
