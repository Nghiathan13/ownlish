import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CatalogWordsTable } from "@/features/collections/detail/system/panel/components/CatalogWordsTable";
import type { useSystemCollectionWordsPanel } from "@/features/collections/detail/system/panel/hooks/useSystemCollectionWordsPanel";
import { CATALOG_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/system/panel/lib/catalogTableColumns";
import {
  VocabularyColumnPicker,
  VocabularyPagination,
  VocabularySearch,
} from "@/features/collections/detail/shared/components";
import { ImportTargetCollectionSelect } from "@/features/collections/shared/components/ImportTargetCollectionSelect";
import { iconTextButtonClassName } from "@/shared/ui/button";

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
  onImportTargetChange: (collectionId: string) => void;
  onRetry?: () => void;
  resolvedImportTargetCollectionId: string | null;
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
  onImportTargetChange,
  onRetry,
  paginatedWords,
  resolvedImportTargetCollectionId,
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
  const canImport =
    hasCollectionsList &&
    userOwnedCollections.length > 0 &&
    Boolean(resolvedImportTargetCollectionId);

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
        <VocabularyPagination
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
