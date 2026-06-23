export const VOCABULARY_PAGE_SIZE_OPTIONS = [20, 50, 100, 500] as const;

export type VocabularyPageSize =
  (typeof VOCABULARY_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_VOCABULARY_PAGE_SIZE: VocabularyPageSize = 50;

export function isVocabularyPageSize(value: number): value is VocabularyPageSize {
  return VOCABULARY_PAGE_SIZE_OPTIONS.includes(value as VocabularyPageSize);
}
