import { describe, expect, it } from "vitest";
import {
  evaluateDictationTyping,
  getSegmentWords,
  normalizeDictationToken,
} from "./dictationTyping";
import type { DictationSegment } from "@/entities/dictation/model/types";

function segment(text: string): DictationSegment {
  return {
    id: "s1",
    startMs: 0,
    endMs: 1000,
    text,
  };
}

describe("normalizeDictationToken", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeDictationToken("I'm")).toBe("im");
    expect(normalizeDictationToken("Hello,")).toBe("hello");
    expect(normalizeDictationToken("WORLD!")).toBe("world");
  });
});

describe("getSegmentWords", () => {
  it("splits and normalizes words", () => {
    expect(getSegmentWords(segment("Hello, world!"))).toEqual([
      { raw: "Hello,", normalized: "hello" },
      { raw: "world!", normalized: "world" },
    ]);
  });

  it("drops punctuation-only tokens", () => {
    expect(getSegmentWords(segment("hi — there"))).toEqual([
      { raw: "hi", normalized: "hi" },
      { raw: "there", normalized: "there" },
    ]);
  });
});

describe("evaluateDictationTyping", () => {
  const words = getSegmentWords(segment("Hello world foo"));

  it("marks yellow on the first ungraded prefix match", () => {
    expect(evaluateDictationTyping(words, "hel")).toMatchObject({
      badgeStates: ["yellow", "idle", "idle"],
      yellowDrafts: [
        {
          index: 0,
          matchedLength: 3,
          prefix: "Hel",
        },
      ],
      wrongDrafts: [],
    });
  });

  it("shows expected casing for a yellow prefix draft", () => {
    const tonight = getSegmentWords(segment("Tonight"));
    expect(evaluateDictationTyping(tonight, "to").yellowDrafts).toEqual([
      {
        index: 0,
        matchedLength: 2,
        prefix: "To",
      },
    ]);
  });

  it("marks red on the first ungraded badge when draft matches nothing", () => {
    expect(evaluateDictationTyping(words, "zzz")).toMatchObject({
      badgeStates: ["red", "idle", "idle"],
      wrongDrafts: [{ index: 0, text: "zzz" }],
    });
  });

  it("exposes the raw wrong draft text for the red badge", () => {
    expect(evaluateDictationTyping(words, "lel").wrongDrafts).toEqual([
      { index: 0, text: "lel" },
    ]);
    expect(evaluateDictationTyping(words, "hel").wrongDrafts).toEqual([]);
  });

  it("marks green for completed exact matches after space", () => {
    expect(evaluateDictationTyping(words, "hello ").badgeStates).toEqual([
      "green",
      "idle",
      "idle",
    ]);
  });

  it("marks green immediately when draft equals a full word", () => {
    expect(evaluateDictationTyping(words, "hello").badgeStates).toEqual([
      "green",
      "idle",
      "idle",
    ]);
  });

  it("matches completed tokens to the earliest remaining ungraded word", () => {
    expect(evaluateDictationTyping(words, "world ").badgeStates).toEqual([
      "idle",
      "green",
      "idle",
    ]);
  });

  it("applies yellow to the next matching prefix after greens", () => {
    expect(evaluateDictationTyping(words, "hello wo").badgeStates).toEqual([
      "green",
      "yellow",
      "idle",
    ]);
  });

  it("marks allMatched when the last draft word matches exactly", () => {
    expect(evaluateDictationTyping(words, "hello world foo").allMatched).toBe(
      true,
    );
    expect(evaluateDictationTyping(words, "hello world ").allMatched).toBe(
      false,
    );
  });

  it("ignores case and punctuation while matching", () => {
    expect(evaluateDictationTyping(words, "HELLO,").badgeStates).toEqual([
      "green",
      "idle",
      "idle",
    ]);
    expect(evaluateDictationTyping(words, "HELLO, ").badgeStates).toEqual([
      "green",
      "idle",
      "idle",
    ]);
  });

  it("only compares a draft before a correct word with earlier badges", () => {
    expect(evaluateDictationTyping(words, "hel world")).toMatchObject({
      badgeStates: ["yellow", "green", "idle"],
      yellowDrafts: [{ index: 0, matchedLength: 3, prefix: "Hel" }],
    });
  });

  it("only compares a draft after a correct word with later badges", () => {
    expect(evaluateDictationTyping(words, "hello fo")).toMatchObject({
      badgeStates: ["green", "idle", "yellow"],
      yellowDrafts: [{ index: 2, matchedLength: 2, prefix: "fo" }],
    });
  });

  it("only compares a draft between correct words with badges between them", () => {
    expect(evaluateDictationTyping(words, "hello zzz foo")).toMatchObject({
      badgeStates: ["green", "red", "green"],
      wrongDrafts: [{ index: 1, text: "zzz" }],
    });
  });

  it("does not match a completed word outside its anchor window", () => {
    expect(evaluateDictationTyping(words, "world hello ")).toMatchObject({
      badgeStates: ["idle", "green", "red"],
      wrongDrafts: [{ index: 2, text: "hello" }],
    });
  });

  it("marks every unmatched token after a green within later badges", () => {
    const phrase = getSegmentWords(segment("show you off"));
    expect(evaluateDictationTyping(phrase, "show y of")).toMatchObject({
      badgeStates: ["green", "yellow", "yellow"],
      yellowDrafts: [
        { index: 1, matchedLength: 1, prefix: "y" },
        { index: 2, matchedLength: 2, prefix: "of" },
      ],
    });
  });

  it("inserts extra red badges for wrong tokens between greens", () => {
    const phrase = getSegmentWords(segment("show you off"));
    expect(evaluateDictationTyping(phrase, "show a e you")).toMatchObject({
      badgeStates: ["green", "green", "idle"],
      extraWrongDrafts: [
        { afterBadgeIndex: 0, text: "a" },
        { afterBadgeIndex: 0, text: "e" },
      ],
      wrongDrafts: [],
      yellowDrafts: [],
    });
  });
});
