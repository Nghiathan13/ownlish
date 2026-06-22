"use client";

import { useMemo, useState } from "react";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import {
  AddWordForm,
  DeleteDefinitionsConfirm,
  EditWordPanel,
  VocabularyColumnPicker,
  VocabularyPagination,
  VocabularySearch,
  VocabularyStateBlock,
  VocabularyTable,
} from "@/features/vocabulary/components";
import { useVocabularyTableColumnVisibility } from "@/features/vocabulary/hooks/useVocabularyTableColumnVisibility";
import { useVocabularyWords } from "@/features/vocabulary/hooks/useVocabularyWords";
import {
  getSelectableDefinitions,
  getSelectedDefinitions,
} from "@/features/vocabulary/lib/vocabularySelection";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { Modal } from "@/shared/ui/Modal";
import { classNames } from "@/shared/lib/classNames";

const EMPTY_DEFINITION_SELECTION = new Set<string>();

type EditingTarget = {
  word: VocabWord;
  definitionId: string;
};

type CollectionWordsPanelProps = {
  className?: string;
  collectionId: string;
};

export function CollectionWordsPanel({
  className,
  collectionId,
}: CollectionWordsPanelProps) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    canGoNext,
    canGoPrevious,
    createWord,
    deleteDefinitions,
    isDeletingDefinitions,
    isInitialLoading,
    isRefreshing,
    loadError,
    nextPage,
    offset,
    pageSize,
    previousPage,
    reload,
    setPageSize,
    totalWords,
    updateWord,
    updatingDefinitionId,
    words,
  } = useVocabularyWords({
    collectionId,
    isAuthenticated,
    search: debouncedSearch,
    userId: user?.id ?? null,
  });
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(
    null,
  );
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const { columnVisibility, toggleColumn } =
    useVocabularyTableColumnVisibility();
  const selectionScope = `${collectionId}:${debouncedSearch}:${offset}:${pageSize}`;
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
    () => getSelectableDefinitions(words),
    [words],
  );
  const selectedDefinitions = useMemo(
    () => getSelectedDefinitions(words, selectedDefinitionIds),
    [selectedDefinitionIds, words],
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

  async function handleBulkDelete() {
    await deleteDefinitions(selectedDefinitions);
    updateSelection(() => new Set());
    setIsBulkDeleteOpen(false);
  }

  return (
    <div className={classNames("flex min-h-0 flex-col", className)}>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
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
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <VocabularySearch search={search} onSearchChange={setSearch} />
          <VocabularyColumnPicker
            columnVisibility={columnVisibility}
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

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border">
          {isInitialLoading || loadError || words.length === 0 ? (
            <VocabularyStateBlock
              error={loadError}
              hasSearch={Boolean(debouncedSearch.trim())}
              isEmpty={words.length === 0}
              isLoading={isInitialLoading}
              onRetry={reload}
            />
          ) : (
            <div
              className={`min-h-0 flex-1 overflow-auto ${
                isRefreshing ? "pointer-events-none opacity-50" : "opacity-100"
              }`}
            >
              <VocabularyTable
                allDefinitionsSelected={allDefinitionsSelected}
                columnVisibility={columnVisibility}
                onEdit={(word, definition) => {
                  if (definition) {
                    setEditingTarget({
                      word,
                      definitionId: definition.id,
                    });
                  }
                }}
                onToggleAllDefinitions={toggleAllDefinitions}
                onToggleDefinition={toggleDefinition}
                selectedDefinitionIds={selectedDefinitionIds}
                someDefinitionsSelected={someDefinitionsSelected}
                words={words}
              />
            </div>
          )}
        </div>

        {!isInitialLoading && !loadError && words.length > 0 ? (
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
