import { describe, expect, it } from "vitest";
import type { DictationSegment } from "@/entities/dictation-study";
import { getSegmentWordBadges } from "./segmentBadges";

function segment(text: string): DictationSegment {
  return { id: "s001", startMs: 0, endMs: 1000, text };
}

describe("getSegmentWordBadges", () => {
  it("creates one badge per word using its letters and digits", () => {
    expect(getSegmentWordBadges(segment("Hello, 2026!"))).toEqual([
      "•••••",
      "••••",
    ]);
  });

  it("trims whitespace and keeps a minimum one-dot badge for punctuation-only tokens", () => {
    expect(getSegmentWordBadges(segment("  ...   can't  "))).toEqual([
      "•",
      "••••",
    ]);
  });

  it("counts unicode letters without counting punctuation", () => {
    expect(getSegmentWordBadges(segment("café—naïve"))).toEqual(["•••••••••"]);
  });
});
