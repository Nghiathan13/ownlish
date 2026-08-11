"use client";

import { VOCABULARY_PAGE_SIZE_OPTIONS } from "@/entities/vocab";
import { AddWordForm } from "@/_pages/collections/ui/vocabulary/forms/AddWordForm";
import { DeleteDefinitionsConfirm } from "@/_pages/collections/ui/vocabulary/forms/DeleteDefinitionsConfirm";
import { EditWordPanel } from "@/_pages/collections/ui/vocabulary/forms/EditWordPanel";
import { VocabularyTable } from "@/_pages/collections/ui/vocabulary/VocabularyTable";
import { BackToCollectionsLink } from "./BackToCollectionsLink";
import {
  WordsColumnPicker,
  WordsPagination,
  WordsSearch,
} from "@/shared/ui/WordsTable";
import type { useCollectionWordsPanel } from "@/_pages/collections/model/vocabulary/panel/useCollectionWordsPanel";
import { VOCABULARY_TOGGLEABLE_COLUMNS } from "@/_pages/collections/lib/vocabulary/panel/vocabularyTableColumns";
import { getAddWordModalTitleParts } from "@/_pages/collections/lib/vocabulary/panel/addWordModalTitle";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons";
import { DeleteIcon } from "@/shared/ui/icons";
import { Modal } from "@/shared/ui/Modal";

type CollectionWordsPanelState = ReturnType<typeof useCollectionWordsPanel>;

type CollectionWordsPanelBodyProps = CollectionWordsPanelState & {
  collectionName: string | null;
};

export function CollectionWordsPanelBody({
  allDefinitionsSelected,
  collectionName,
  canGoNext,
  canGoPrevious,
  columnVisibility,
  createWord,
  debouncedSearch,
  editingTarget,
  handleBulkDelete,
  handleEditWord,
  isAddWordOpen,
  isBulkDeleteOpen,
  isDeletingDefinitions,
  isInitialLoading,
  isRefreshing,
  loadError,
  nextPage,
  offset,
  onReload,
  pageSize,
  previousPage,
  search,
  selectedDefinitionIds,
  selectedDefinitions,
  setIsAddWordOpen,
  setIsBulkDeleteOpen,
  setEditingTarget,
  setPageSize,
  setSearch,
  someDefinitionsSelected,
  toggleAllDefinitions,
  toggleColumn,
  toggleDefinition,
  totalWords,
  updateWord,
  updatingDefinitionId,
  words,
}: CollectionWordsPanelBodyProps) {
  const t = useT();
  const addWordModalTitle = getAddWordModalTitleParts(collectionName, t);
  const columns = VOCABULARY_TOGGLEABLE_COLUMNS.map((column) => ({
    id: column.id,
    label: t(column.labelKey),
  }));

  return (
    <>
      <div
        className={
          selectedDefinitions.length > 0
            ? "mt-4 mb-4 flex shrink-0 flex-row items-center justify-end px-4"
            : "mt-4 mb-4 flex shrink-0 flex-row flex-wrap items-center gap-2 px-4"
        }
      >
        {selectedDefinitions.length > 0 ? (
          <button
            type="button"
            className={iconTextButtonClassName(
              "w-fit shrink-0 border-danger-border bg-danger-background text-danger hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
            )}
            onClick={() => setIsBulkDeleteOpen(true)}
          >
            <DeleteIcon />
            {formatMessage(t("wordsTable.deleteCount"), {
              count: selectedDefinitions.length,
            })}
          </button>
        ) : (
          <>
            <BackToCollectionsLink />
            <button
              type="button"
              className={iconTextButtonClassName(
                "w-fit shrink-0 border-primary bg-primary text-primary-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
              )}
              onClick={() => setIsAddWordOpen(true)}
            >
              <AddIcon />
              {t("wordsTable.addWord")}
            </button>
            <WordsSearch search={search} onSearchChange={setSearch} />
            <WordsColumnPicker
              columnVisibility={columnVisibility}
              columns={columns}
              onToggleColumn={toggleColumn}
            />
          </>
        )}
      </div>

      {isAddWordOpen ? (
        <Modal
          title={
            <>
              {addWordModalTitle.prefix ? (
                <>
                  <span className="font-normal text-muted-foreground">
                    {addWordModalTitle.prefix}
                  </span>{" "}
                </>
              ) : null}
              <span>{addWordModalTitle.collectionName}</span>
            </>
          }
          onClose={() => setIsAddWordOpen(false)}
        >
          <AddWordForm
            onCreate={createWord}
            onCreated={() => setIsAddWordOpen(false)}
          />
        </Modal>
      ) : null}

      {editingTarget ? (
        <Modal
          title={t("wordsTable.editWord")}
          description={t("wordsTable.editWordDescription")}
          onClose={() => setEditingTarget(null)}
        >
          <EditWordPanel
            key={`${editingTarget.word.id}-${editingTarget.definitionId}`}
            definitionId={editingTarget.definitionId}
            isSubmitting={
              updatingDefinitionId === editingTarget.definitionId
            }
            onClose={() => setEditingTarget(null)}
            onUpdate={updateWord}
            word={editingTarget.word}
          />
        </Modal>
      ) : null}

      {isBulkDeleteOpen ? (
        <Modal
          title={t("wordsTable.deleteDefinitions")}
          description={t("wordsTable.deleteDefinitionsDescription")}
          onClose={() => setIsBulkDeleteOpen(false)}
        >
          <DeleteDefinitionsConfirm
            count={selectedDefinitions.length}
            isDeleting={isDeletingDefinitions}
            onCancel={() => setIsBulkDeleteOpen(false)}
            onConfirm={handleBulkDelete}
          />
        </Modal>
      ) : null}

      <VocabularyTable
        className={
          isRefreshing && !isInitialLoading && !loadError && words.length > 0
            ? "pointer-events-none opacity-50"
            : undefined
        }
        allDefinitionsSelected={allDefinitionsSelected}
        columnVisibility={columnVisibility}
        error={loadError}
        hasSearch={Boolean(debouncedSearch.trim())}
        isLoading={isInitialLoading}
        onEdit={handleEditWord}
        onRetry={onReload}
        onToggleAllDefinitions={toggleAllDefinitions}
        onToggleDefinition={toggleDefinition}
        selectedDefinitionIds={selectedDefinitionIds}
        someDefinitionsSelected={someDefinitionsSelected}
        words={words}
      />

      {!isInitialLoading && !loadError && words.length > 0 ? (
        <WordsPagination
          className="mb-4 shrink-0 px-4"
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          offset={offset}
          onNext={nextPage}
          onPageSizeChange={setPageSize}
          onPrevious={previousPage}
          pageSize={pageSize}
          pageSizeOptions={VOCABULARY_PAGE_SIZE_OPTIONS}
          total={totalWords}
        />
      ) : null}
    </>
  );
}
