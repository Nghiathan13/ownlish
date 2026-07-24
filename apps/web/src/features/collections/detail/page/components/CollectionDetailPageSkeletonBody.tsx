"use client";

import { useMemo } from "react";
import { WordsTableSkeleton } from "@/features/collections/detail/shared/components/WordsTableSkeleton";
import { getVocabularyWordsTableHeadColumns } from "@/features/collections/detail/shared/lib/wordsTableHeadColumns";
import {
  createDefaultColumnVisibility,
  parseColumnVisibility,
  VOCABULARY_COLUMN_VISIBILITY_STORAGE_KEY,
} from "@/features/collections/detail/user/panel/lib/vocabularyTableColumns";
import { useT } from "@/shared/providers/LocaleProvider";
import { Skeleton } from "@/shared/ui/Skeleton";

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
