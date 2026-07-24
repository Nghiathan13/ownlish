import type { MessageKey } from "@/shared/i18n/messages";

export const VOCABULARY_TOGGLEABLE_COLUMNS = [
  { id: "ipaUk", labelKey: "wordsTable.ipaUk" },
  { id: "ipaUs", labelKey: "wordsTable.ipaUs" },
  { id: "type", labelKey: "wordsTable.type" },
  { id: "meaning", labelKey: "wordsTable.meaning" },
  { id: "level", labelKey: "wordsTable.level" },
  { id: "example", labelKey: "wordsTable.example" },
  { id: "nextReview", labelKey: "wordsTable.nextReview" },
] as const satisfies ReadonlyArray<{
  id: string;
  labelKey: MessageKey;
}>;

export type VocabularyToggleableColumnId =
  (typeof VOCABULARY_TOGGLEABLE_COLUMNS)[number]["id"];

export type VocabularyColumnVisibility = Record<
  VocabularyToggleableColumnId,
  boolean
>;

export const VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY =
  "engvocab:vocabulary-table-columns";
