"use client";

import { useCallback, useState } from "react";
import {
  createDefaultColumnVisibility,
  parseColumnVisibility,
  toggleColumnVisibility,
  VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY,
  type VocabularyToggleableColumnId,
} from "@/features/vocabulary/lib/vocabularyTableColumns";

function readColumnVisibilityFromStorage() {
  if (typeof window === "undefined") {
    return createDefaultColumnVisibility();
  }

  return parseColumnVisibility(
    localStorage.getItem(VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY),
  );
}

export function useVocabularyTableColumnVisibility() {
  const [columnVisibility, setColumnVisibility] = useState(
    readColumnVisibilityFromStorage,
  );

  const toggleColumn = useCallback((columnId: VocabularyToggleableColumnId) => {
    setColumnVisibility((current) => {
      const next = toggleColumnVisibility(current, columnId);
      localStorage.setItem(
        VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY,
        JSON.stringify(next),
      );
      return next;
    });
  }, []);

  return {
    columnVisibility,
    toggleColumn,
  };
}
