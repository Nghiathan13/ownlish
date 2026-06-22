"use client";

import { useState } from "react";
import type { CatalogWord, CollectionSummary } from "@/entities/collection/api/collections";
import { CatalogWordsTable } from "@/features/collections/components/CatalogWordsTable";
import { ImportTargetCollectionSelect } from "@/features/collections/components/ImportTargetCollectionSelect";
import { useCatalogWordsPagination } from "@/features/collections/hooks/useCatalogWordsPagination";
import { useCatalogTableColumnVisibility } from "@/features/collections/hooks/useCatalogTableColumnVisibility";
import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/lib/catalogTableColumns";
import {
  VocabularyColumnPicker,
  VocabularyPagination,
  VocabularySearch,
} from "@/features/collections/words/components";
import { classNames } from "@/shared/lib/classNames";
import { iconTextButtonClassName } from "@/shared/ui/button";

type SystemCollectionWordsPanelProps = {
  className?: string;
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  onImportClick: () => void;
  onImportTargetChange: (collectionId: string) => void;
  resolvedImportTargetCollectionId: string | null;
  userOwnedCollections: CollectionSummary[];
  words: CatalogWord[];
};

export function SystemCollectionWordsPanel({
  className,
  importError,
  importResultMessage,
  isImporting,
  onImportClick,
  onImportTargetChange,
  resolvedImportTargetCollectionId,
  userOwnedCollections,
  words,
}: SystemCollectionWordsPanelProps) {
  const [search, setSearch] = useState("");
  const { columnVisibility, toggleColumn } = useCatalogTableColumnVisibility();
  const {
    canGoNext,
    canGoPrevious,
    debouncedSearch,
    nextPage,
    offset,
    pageSize,
    paginatedWords,
    previousPage,
    setPageSize,
    totalWords,
  } = useCatalogWordsPagination(words, search);
  const hasSearch = Boolean(debouncedSearch.trim());
  const canImport =
    userOwnedCollections.length > 0 && Boolean(resolvedImportTargetCollectionId);

  return (
    <div className={classNames("flex min-h-0 flex-col", className)}>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        {canImport ? (
          <div className="flex shrink-0 items-center gap-2">
            <ImportTargetCollectionSelect
              collections={userOwnedCollections}
              onChange={onImportTargetChange}
              value={resolvedImportTargetCollectionId as string}
              variant="toolbar"
            />
            <button
              className={iconTextButtonClassName(
                "w-fit shrink-0",
                "border-foreground bg-foreground text-background",
              )}
              disabled={isImporting}
              onClick={() => {
                void onImportClick();
              }}
              type="button"
            >
              {isImporting ? "Importing..." : "Import"}
            </button>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <VocabularySearch onSearchChange={setSearch} search={search} />
          <VocabularyColumnPicker
            columnVisibility={columnVisibility}
            columns={CATALOG_TOGGLEABLE_COLUMNS}
            onToggleColumn={toggleColumn}
          />
        </div>
      </div>

      {importResultMessage ? (
        <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm">
          {importResultMessage}
        </p>
      ) : null}
      {importError ? (
        <p className="mt-4 rounded-lg border border-border p-3 text-sm text-danger">
          {importError}
        </p>
      ) : null}

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
          {totalWords === 0 ? (
            <CatalogWordsStateBlock hasSearch={hasSearch} />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <CatalogWordsTable
                columnVisibility={columnVisibility}
                words={paginatedWords}
              />
            </div>
          )}
        </div>

        {totalWords > 0 ? (
          <div className="mt-4 shrink-0">
            <VocabularyPagination
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              offset={offset}
              onNext={nextPage}
              onPageSizeChange={setPageSize}
              onPrevious={previousPage}
              pageSize={pageSize}
              total={totalWords}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CatalogWordsStateBlock({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold">
        {hasSearch ? "No matching words." : "No words in this collection."}
      </h2>
      <p className="text-muted-foreground">
        {hasSearch
          ? "Try a different search term."
          : "This collection does not have any catalog words yet."}
      </p>
    </div>
  );
}
