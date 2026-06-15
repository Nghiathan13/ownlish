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

export function createDefaultColumnVisibility(): VocabularyColumnVisibility {
  return Object.fromEntries(
    VOCABULARY_TOGGLEABLE_COLUMNS.map((column) => [column.id, true]),
  ) as VocabularyColumnVisibility;
}

const DEFAULT_COLUMN_VISIBILITY = createDefaultColumnVisibility();

function isToggleableColumnId(
  value: string,
): value is VocabularyToggleableColumnId {
  return VOCABULARY_TOGGLEABLE_COLUMNS.some((column) => column.id === value);
}

export function parseColumnVisibility(
  raw: string | null,
): VocabularyColumnVisibility {
  if (!raw) {
    return createDefaultColumnVisibility();
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return createDefaultColumnVisibility();
    }

    const next = { ...DEFAULT_COLUMN_VISIBILITY };

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== "boolean") {
        continue;
      }

      if (key === "ipa") {
        next.ipaUk = value;
        next.ipaUs = value;
        continue;
      }

      if (isToggleableColumnId(key)) {
        next[key] = value;
      }
    }

    return next;
  } catch {
    return createDefaultColumnVisibility();
  }
}

export function toggleColumnVisibility(
  visibility: VocabularyColumnVisibility,
  columnId: VocabularyToggleableColumnId,
): VocabularyColumnVisibility {
  return {
    ...visibility,
    [columnId]: !visibility[columnId],
  };
}

export function isColumnVisible(
  visibility: VocabularyColumnVisibility,
  columnId: VocabularyToggleableColumnId,
) {
  return visibility[columnId];
}
