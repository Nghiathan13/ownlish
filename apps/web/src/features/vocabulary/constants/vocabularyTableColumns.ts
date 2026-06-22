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

export const VOCABULARY_TABLE_COLUMN_WIDTH = {
  word: "w-[100%]",
  ipaUk: "w-[100%]",
  ipaUs: "w-[100%]",
  meaning: "w-[150%]",
  example: "w-[250%]",
  type: "w-[8rem]",
  level: "w-[4rem]",
  nextReview: "w-[8rem]",
  actions: "w-[5rem]",
} as const;

export const VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY =
  "engvocab:vocabulary-table-columns";
