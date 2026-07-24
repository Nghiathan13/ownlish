"use client";

import { AddWordForm } from "@/features/collections/detail/user/forms/components/AddWordForm";
import { DeleteDefinitionsConfirm } from "@/features/collections/detail/user/forms/components/DeleteDefinitionsConfirm";
import { EditWordPanel } from "@/features/collections/detail/user/forms/components/EditWordPanel";
import { VocabularyTable } from "@/features/collections/detail/user/panel/components/VocabularyTable";
import {
  WordsColumnPicker,
  WordsPagination,
  WordsSearch,
} from "@/features/collections/detail/shared/components";
import type { useCollectionWordsPanel } from "@/features/collections/detail/user/panel/hooks/useCollectionWordsPanel";
import { VOCABULARY_TOGGLEABLE_COLUMNS } from "@/features/collections/detail/user/panel/lib/vocabularyTableColumns";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { Modal } from "@/shared/ui/Modal";

type CollectionWordsPanelState = ReturnType<typeof useCollectionWordsPanel>;

type CollectionWordsPanelBodyProps = CollectionWordsPanelState;

export function CollectionWordsPanelBody({
  allDefinitionsSelected,
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
  const columns = VOCABULARY_TOGGLEABLE_COLUMNS.map((column) => ({
    id: column.id,
    label: t(column.labelKey),
  }));

  return (
    <>
      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <button
          type="button"
          className={iconTextButtonClassName(
            "w-fit shrink-0",
            "border-foreground bg-foreground text-background",
          )}
          onClick={() => setIsAddWordOpen(true)}
        >
          <AddIcon />
          {t("wordsTable.addWord")}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <WordsSearch search={search} onSearchChange={setSearch} />
          <WordsColumnPicker
            columnVisibility={columnVisibility}
            columns={columns}
            onToggleColumn={toggleColumn}
          />
        </div>
        {selectedDefinitions.length > 0 ? (
          <button
            type="button"
            className={iconTextButtonClassName(
              "w-fit shrink-0 sm:ml-auto",
              "border-foreground bg-foreground text-background",
            )}
            onClick={() => setIsBulkDeleteOpen(true)}
          >
            <DeleteIcon />
            {formatMessage(t("wordsTable.deleteCount"), {
              count: selectedDefinitions.length,
            })}
          </button>
        ) : null}
      </div>

      {isAddWordOpen ? (
        <Modal
          title={t("wordsTable.addWord")}
          description={t("wordsTable.addWordDescription")}
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
          total={totalWords}
        />
      ) : null}
    </>
  );
}
