import type { CollectionSummary } from "@/entities/collection/api/collections";
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
import { ImportTargetCollectionSelect } from "@/features/collections/shared/components/ImportTargetCollectionSelect";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { Modal } from "@/shared/ui/Modal";

type CollectionWordsPanelState = ReturnType<typeof useCollectionWordsPanel>;

type CollectionWordsPanelBodyProps = CollectionWordsPanelState & {
  collectionId: string;
  hasCollectionsList: boolean;
  onCollectionChange: (collectionId: string) => void;
  userCollections: CollectionSummary[];
};

export function CollectionWordsPanelBody({
  allDefinitionsSelected,
  canGoNext,
  canGoPrevious,
  collectionId,
  columnVisibility,
  createWord,
  debouncedSearch,
  editingTarget,
  handleBulkDelete,
  handleEditWord,
  hasCollectionsList,
  isAddWordOpen,
  isBulkDeleteOpen,
  isDeletingDefinitions,
  isInitialLoading,
  isRefreshing,
  loadError,
  nextPage,
  offset,
  onCollectionChange,
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
  userCollections,
  words,
}: CollectionWordsPanelBodyProps) {
  return (
    <>
      <div className="mb-4 flex shrink-0 flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2">
          {hasCollectionsList && userCollections.length > 0 ? (
            <ImportTargetCollectionSelect
              ariaLabel="Collection"
              collections={userCollections}
              onChange={onCollectionChange}
              value={collectionId}
              variant="toolbar"
            />
          ) : null}
          <button
            type="button"
            className={iconTextButtonClassName(
              "w-fit shrink-0",
              "border-foreground bg-foreground text-background",
            )}
            onClick={() => setIsAddWordOpen(true)}
          >
            <AddIcon />
            Add word
          </button>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <WordsSearch search={search} onSearchChange={setSearch} />
          <WordsColumnPicker
            columnVisibility={columnVisibility}
            columns={VOCABULARY_TOGGLEABLE_COLUMNS}
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
            Delete ({selectedDefinitions.length})
          </button>
        ) : null}
      </div>

      {isAddWordOpen ? (
        <Modal
          title="Add word"
          description="Add a word to this collection."
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
          title="Edit word"
          description="Update the selected vocabulary definition."
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
          title="Delete definitions"
          description="This action removes the selected definitions from this collection."
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
