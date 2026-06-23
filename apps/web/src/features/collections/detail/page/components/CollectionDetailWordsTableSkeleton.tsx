"use client";

import { useMemo } from "react";
import { parseCollectionKindHint } from "@/entities/collection/lib/collectionDisplay";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";
import {
  getCatalogWordsTableHeadColumns,
  getVocabularyWordsTableHeadColumns,
} from "@/features/collections/detail/shared/lib/wordsTableHeadColumns";
import {
  CATALOG_COLUMN_VISIBILITY_STORAGE_KEY,
  createDefaultCatalogColumnVisibility,
  parseCatalogColumnVisibility,
} from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import {
  createDefaultColumnVisibility,
  parseColumnVisibility,
  VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY,
} from "@/features/collections/detail/user/panel/lib/vocabularyTableColumns";

function getIsSystemCollectionFromUrl() {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return parseCollectionKindHint(params.get("kind")) === "SYSTEM";
}

function readVocabularyColumnVisibilityFromStorage() {
  if (typeof window === "undefined") {
    return createDefaultColumnVisibility();
  }

  return parseColumnVisibility(
    localStorage.getItem(VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY),
  );
}

function readCatalogColumnVisibilityFromStorage() {
  if (typeof window === "undefined") {
    return createDefaultCatalogColumnVisibility();
  }

  return parseCatalogColumnVisibility(
    localStorage.getItem(CATALOG_COLUMN_VISIBILITY_STORAGE_KEY),
  );
}

export function CollectionDetailWordsTableSkeleton() {
  const isSystemCollection = useMemo(() => getIsSystemCollectionFromUrl(), []);

  const columns = useMemo(() => {
    if (isSystemCollection) {
      return getCatalogWordsTableHeadColumns(
        readCatalogColumnVisibilityFromStorage(),
      );
    }

    return getVocabularyWordsTableHeadColumns(
      readVocabularyColumnVisibilityFromStorage(),
    );
  }, [isSystemCollection]);

  return (
    <WordsTableSkeleton columns={columns} showActions={!isSystemCollection} />
  );
}
