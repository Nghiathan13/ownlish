"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { parseCollectionKindHint } from "@/entities/collection/lib/collectionDisplay";
import { BackToCollectionsLink } from "@/features/collections/detail/page/components/BackToCollectionsLink";
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
import { Skeleton } from "@/shared/ui/Skeleton";

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

export function CollectionDetailPageSkeletonBody() {
  const params = useParams<{ collectionId: string }>();
  const collectionId = params.collectionId;
  const searchParams = useSearchParams();
  const isSystemCollection =
    parseCollectionKindHint(searchParams.get("kind")) === "SYSTEM";

  const tableColumns = useMemo(() => {
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
    <>
      <div className="my-4 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
        <BackToCollectionsLink collectionId={collectionId} />
        <Skeleton className="h-10 min-w-[10rem] max-w-[14rem] shrink-0" />
      </div>

      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <Skeleton className="h-10 w-28 shrink-0" />
        <Skeleton className="h-10 min-w-0 flex-1" />
        <Skeleton className="h-10 w-24 shrink-0" />
      </div>

      <WordsTableSkeleton
        columns={tableColumns}
        showActions={!isSystemCollection}
      />
    </>
  );
}
