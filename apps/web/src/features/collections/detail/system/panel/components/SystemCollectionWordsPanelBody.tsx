"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CatalogWordsTable } from "@/features/collections/detail/system/panel/components/CatalogWordsTable";
import type { useSystemCollectionWordsPanel } from "@/features/collections/detail/system/panel/hooks/useSystemCollectionWordsPanel";
import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import {
  WordsColumnPicker,
  WordsPagination,
  WordsSearch,
} from "@/features/collections/detail/shared/components";
import { ImportToolbarButton } from "@/features/collections/shared/components/ImportToolbarButton";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type SystemCollectionWordsPanelState = ReturnType<
  typeof useSystemCollectionWordsPanel
>;

type SystemCollectionWordsPanelBodyProps = SystemCollectionWordsPanelState & {
  hasCollectionsList: boolean;
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  userOwnedCollections: CollectionSummary[];
};

export function SystemCollectionWordsPanelBody({
  allDefinitionsSelected,
  canGoNext,
  canGoPrevious,
  columnVisibility,
  handleImportAllClick,
  handleImportSelectedClick,
  hasCollectionsList,
  hasSearch,
  importError,
  importResultMessage,
  isImporting,
  isLoading = false,
  loadError = null,
  onRetry,
  paginatedWords,
  search,
  selectedDefinitionIds,
  selectedDefinitions,
  setPageSize,
  setSearch,
  someDefinitionsSelected,
  toggleAllDefinitions,
  toggleColumn,
  toggleDefinition,
  totalWords,
  userOwnedCollections,
  nextPage,
  offset,
  pageSize,
  previousPage,
}: SystemCollectionWordsPanelBodyProps) {
  const t = useT();
  const canImport =
    hasCollectionsList && userOwnedCollections.length > 0;
  const selectedCount = selectedDefinitions.length;
  const importLabel = isImporting
    ? t("collections.importing")
    : selectedCount > 0
      ? formatMessage(t("collections.importCount"), { count: selectedCount })
      : t("wordsTable.importAll");
  const columns = CATALOG_TOGGLEABLE_COLUMNS.map((column) => ({
    id: column.id,
    label: t(column.labelKey),
  }));

  return (
    <>
      <div className="mb-4 flex shrink-0 flex-row items-center gap-2 px-4">
        {canImport && selectedCount > 0 ? (
          <ImportToolbarButton
            collections={userOwnedCollections}
            disabled={isImporting}
            label={importLabel}
            onImport={(targetCollectionId) => {
              void handleImportSelectedClick(targetCollectionId);
            }}
          />
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <WordsSearch onSearchChange={setSearch} search={search} />
            <WordsColumnPicker
              columnVisibility={columnVisibility}
              columns={columns}
              onToggleColumn={toggleColumn}
            />
            {canImport ? (
              <ImportToolbarButton
                collections={userOwnedCollections}
                disabled={isImporting}
                label={importLabel}
                onImport={(targetCollectionId) => {
                  void handleImportAllClick(targetCollectionId);
                }}
              />
            ) : null}
          </div>
        )}
      </div>

      {importResultMessage ? (
        <div className="mb-4 shrink-0 px-4">
          <p className="rounded-lg border border-border bg-muted p-3 text-sm">
            {importResultMessage}
          </p>
        </div>
      ) : null}
      {importError ? (
        <div className="mb-4 shrink-0 px-4">
          <p className="rounded-lg border border-border p-3 text-sm text-danger">
            {importError}
          </p>
        </div>
      ) : null}

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

      {totalWords > 0 && !isLoading && !loadError ? (
        <WordsPagination
          className="mb-4 shrink-0 px-4"
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
