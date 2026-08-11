import { describe, expect, it } from "vitest";
import { splitReadingPartInstruction } from "./splitReadingPartInstruction";

describe("splitReadingPartInstruction", () => {
  it("splits the questions range from the suffix", () => {
    expect(
      splitReadingPartInstruction(
        "Questions 131-134 refer to the following flyer.",
      ),
    ).toEqual({
      range: "Questions 131-134",
      suffix: " refer to the following flyer.",
    });
  });

  it("returns null for non-reading instructions", () => {
    expect(
      splitReadingPartInstruction(
        "Select the best answer to complete the sentence.",
      ),
    ).toBeNull();
  });
});
