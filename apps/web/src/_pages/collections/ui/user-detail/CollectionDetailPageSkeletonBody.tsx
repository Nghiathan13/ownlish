"use client";

import { useMemo } from "react";
import {
  createDefaultColumnVisibility,
  getVocabularyWordsTableHeadColumns,
  parseColumnVisibility,
} from "../../lib/vocabulary/panel/vocabularyTableColumns";
import { VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY } from "../../config/vocabulary/panel/vocabularyTableColumns";
import { useT } from "@/shared/lib/providers";
import { Skeleton } from "@/shared/ui/Skeleton";
import { WordsTableSkeleton } from "@/shared/ui/WordsTable";

function readVocabularyColumnVisibilityFromStorage() {
  if (typeof window === "undefined") {
    return createDefaultColumnVisibility();
  }

  return parseColumnVisibility(
    localStorage.getItem(VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY),
  );
}

export function CollectionDetailPageSkeletonBody() {
  const t = useT();
  const tableColumns = useMemo(
    () =>
      getVocabularyWordsTableHeadColumns(
        readVocabularyColumnVisibilityFromStorage(),
        t,
      ),
    [t],
  );

  return (
    <>
      <div className="mt-4 mb-4 flex shrink-0 flex-row flex-wrap items-center gap-2 px-4">
        <Skeleton className="h-10 w-20 shrink-0" />
        <Skeleton className="h-10 w-28 shrink-0" />
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="h-10 w-24 shrink-0" />
      </div>

      <WordsTableSkeleton columns={tableColumns} showActions />
    </>
  );
}
