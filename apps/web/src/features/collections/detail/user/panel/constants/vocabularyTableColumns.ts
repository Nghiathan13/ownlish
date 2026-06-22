export const VOCABULARY_TOGGLEABLE_COLUMNS = [
  { id: "ipaUk", label: "IPA UK" },
  { id: "ipaUs", label: "IPA US" },
  { id: "type", label: "Type" },
  { id: "meaning", label: "Meaning" },
  { id: "level", label: "Level" },
  { id: "example", label: "Example" },
  { id: "nextReview", label: "Next review" },
] as const;

export type VocabularyToggleableColumnId =
  (typeof VOCABULARY_TOGGLEABLE_COLUMNS)[number]["id"];

export type VocabularyColumnVisibility = Record<
  VocabularyToggleableColumnId,
  boolean
>;

export const VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY =
  "engvocab:vocabulary-table-columns";
