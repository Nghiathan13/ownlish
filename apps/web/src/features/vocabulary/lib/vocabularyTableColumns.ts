import {
  VOCABULARY_TOGGLEABLE_COLUMNS,
  type VocabularyColumnVisibility,
  type VocabularyToggleableColumnId,
} from "@/features/vocabulary/constants/vocabularyTableColumns";

export {
  VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY,
  VOCABULARY_TABLE_COLUMN_WIDTH,
  VOCABULARY_TOGGLEABLE_COLUMNS,
  type VocabularyColumnVisibility,
  type VocabularyToggleableColumnId,
} from "@/features/vocabulary/constants/vocabularyTableColumns";

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
