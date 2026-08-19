import { describe, expect, it } from "vitest";
import { isDictationAnswerCorrect, normalizeDictationAnswer } from "./answer";

describe("normalizeDictationAnswer", () => {
  it("ignores casing, punctuation, whitespace, and apostrophe variants", () => {
    expect(normalizeDictationAnswer("  Don't—stop,  now! ")).toBe("don t stop now");
    expect(normalizeDictationAnswer("DON’T STOP NOW")).toBe("don t stop now");
  });

  it("matches normalized transcript text only", () => {
    expect(isDictationAnswerCorrect("Hello, world!", " hello world ")).toBe(true);
    expect(isDictationAnswerCorrect("Hello there", "hello world")).toBe(false);
  });
});
