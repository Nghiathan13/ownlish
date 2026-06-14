import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOCABULARY_PAGE_SIZE,
  isVocabularyPageSize,
  VOCABULARY_PAGE_SIZE_OPTIONS,
} from "./vocabPagination";

describe("vocabPagination", () => {
  it("exposes supported page size options", () => {
    expect(VOCABULARY_PAGE_SIZE_OPTIONS).toEqual([100, 500]);
    expect(DEFAULT_VOCABULARY_PAGE_SIZE).toBe(100);
  });

  it("validates page size values", () => {
    expect(isVocabularyPageSize(100)).toBe(true);
    expect(isVocabularyPageSize(500)).toBe(true);
    expect(isVocabularyPageSize(50)).toBe(false);
  });
});
