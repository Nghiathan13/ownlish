import { describe, expect, it } from "vitest";
import { normalizeDictionaryLookup } from "./normalizeDictionaryLookup";

describe("normalizeDictionaryLookup", () => {
  it("trims and lowercases one ASCII English word", () => {
    expect(normalizeDictionaryLookup(" A ")).toBe("a");
  });

  it("rejects punctuation, phrases, and non-ASCII words", () => {
    expect(normalizeDictionaryLookup("a.")).toBeNull();
    expect(normalizeDictionaryLookup("a word")).toBeNull();
    expect(normalizeDictionaryLookup("à")).toBeNull();
  });
});
