import type { DictationSegment } from "@/entities/dictation/model/types";

export function getSegmentWordBadges(segment: DictationSegment) {
  return segment.text
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => {
      const characterCount = Array.from(word).filter((character) =>
        /[\p{L}\p{N}]/u.test(character),
      ).length;

      return "•".repeat(Math.max(1, characterCount));
    });
}
