"use client";

import { useMemo, useState } from "react";
import type { CatalogWord, CollectionSummary } from "@/entities/collection/api/collections";
import { CatalogWordsTable } from "@/features/collections/components/CatalogWordsTable";
import { ImportTargetCollectionSelect } from "@/features/collections/components/ImportTargetCollectionSelect";
import { useCatalogWordsPagination } from "@/features/collections/hooks/useCatalogWordsPagination";
import { useCatalogTableColumnVisibility } from "@/features/collections/hooks/useCatalogTableColumnVisibility";
import {
  getSelectableCatalogDefinitions,
  getSelectedCatalogDefinitions,
} from "@/features/collections/lib/catalogSelection";
import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/lib/catalogTableColumns";
import {
  VocabularyColumnPicker,
  VocabularyPagination,
  VocabularySearch,
} from "@/features/collections/words/components";
import { classNames } from "@/shared/lib/classNames";
import { iconTextButtonClassName } from "@/shared/ui/button";

const EMPTY_DEFINITION_SELECTION = new Set<string>();

type SystemCollectionWordsPanelProps = {
  className?: string;
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onImportClick: (catalogDefinitionIds?: string[]) => Promise<void>;
  onImportTargetChange: (collectionId: string) => void;
  onRetry?: () => void;
  resolvedImportTargetCollectionId: string | null;
  userOwnedCollections: CollectionSummary[];
  words: CatalogWord[];
};

export function SystemCollectionWordsPanel({
  className,
  importError,
  importResultMessage,
  isImporting,
  isLoading = false,
  loadError = null,
  onImportClick,
  onImportTargetChange,
  onRetry,
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
  const selectionScope = `${debouncedSearch}:${offset}:${pageSize}`;
  const [selectionByScope, setSelectionByScope] = useState<{
    scope: string;
    ids: Set<string>;
  }>(() => ({
    scope: selectionScope,
    ids: new Set(),
  }));
  const selectedDefinitionIds =
    selectionByScope.scope === selectionScope
      ? selectionByScope.ids
      : EMPTY_DEFINITION_SELECTION;
  const hasSearch = Boolean(debouncedSearch.trim());
  const canImport =
    userOwnedCollections.length > 0 && Boolean(resolvedImportTargetCollectionId);

  function updateSelection(
    updater: (currentIds: Set<string>) => Set<string>,
  ) {
    setSelectionByScope((current) => {
      const currentIds =
        current.scope === selectionScope
          ? current.ids
          : EMPTY_DEFINITION_SELECTION;

      return {
        scope: selectionScope,
        ids: updater(currentIds),
      };
    });
  }

  const selectableDefinitions = useMemo(
    () => getSelectableCatalogDefinitions(paginatedWords),
    [paginatedWords],
  );
  const selectedDefinitions = useMemo(
    () =>
      getSelectedCatalogDefinitions(paginatedWords, selectedDefinitionIds),
    [paginatedWords, selectedDefinitionIds],
  );
  const allDefinitionsSelected =
    selectableDefinitions.length > 0 &&
    selectableDefinitions.every((item) =>
      selectedDefinitionIds.has(item.definition.id),
    );
  const someDefinitionsSelected = selectableDefinitions.some((item) =>
    selectedDefinitionIds.has(item.definition.id),
  );

  function toggleDefinition(definitionId: string) {
    updateSelection((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(definitionId)) {
        nextIds.delete(definitionId);
      } else {
        nextIds.add(definitionId);
      }

      return nextIds;
    });
  }

  function toggleAllDefinitions() {
    updateSelection((currentIds) => {
      const allIds = selectableDefinitions.map((item) => item.definition.id);
      const allSelected =
        allIds.length > 0 && allIds.every((id) => currentIds.has(id));

      if (allSelected) {
        return new Set();
      }

      return new Set(allIds);
    });
  }

  async function handleImportAllClick() {
    try {
      await onImportClick();
      updateSelection(() => new Set());
    } catch {
      // Parent renders the import error message.
    }
  }

  async function handleImportSelectedClick() {
    try {
      await onImportClick(
        selectedDefinitions.map((item) => item.definition.id),
      );
      updateSelection(() => new Set());
    } catch {
      // Parent renders the import error message.
    }
  }

  return (
    <>
      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
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
                void handleImportAllClick();
              }}
              type="button"
            >
              {isImporting ? "Importing..." : "Import all"}
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
        {selectedDefinitions.length > 0 ? (
          <button
            className={iconTextButtonClassName(
              "w-fit shrink-0 sm:ml-auto",
              "border-foreground bg-foreground text-background",
            )}
            disabled={isImporting}
            onClick={() => {
              void handleImportSelectedClick();
            }}
            type="button"
          >
            {isImporting
              ? "Importing..."
              : `Import (${selectedDefinitions.length})`}
          </button>
        ) : null}
      </div>

      {importResultMessage ? (
        <div className="mb-4 px-4">
          <p className="rounded-lg border border-border bg-muted p-3 text-sm">
            {importResultMessage}
          </p>
        </div>
      ) : null}
      {importError ? (
        <div className="mb-4 px-4">
          <p className="rounded-lg border border-border p-3 text-sm text-danger">
            {importError}
          </p>
        </div>
      ) : null}

      <div
        className={classNames(
          "mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-auto rounded-xl border border-border",
          className,
        )}
      >
        <CatalogWordsTable
          allDefinitionsSelected={allDefinitionsSelected}
          columnVisibility={columnVisibility}
          error={loadError}
          hasSearch={hasSearch}
          isLoading={isLoading}
          onRetry={onRetry}
          onToggleAllDefinitions={toggleAllDefinitions}
          onToggleDefinition={toggleDefinition}
          selectedDefinitionIds={selectedDefinitionIds}
          someDefinitionsSelected={someDefinitionsSelected}
          words={paginatedWords}
        />
      </div>

      {totalWords > 0 && !isLoading && !loadError ? (
        <VocabularyPagination
          className="mb-4 px-4"
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          offset={offset}
          onNext={nextPage}
          onPageSizeChange={setPageSize}
          onPrevious={previousPage}
          pageSize={pageSize}
          total={totalWords}
        />
      ) : null}
    </>
  );
}
