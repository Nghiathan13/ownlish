"use client";

import { useMemo, useState } from "react";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  AddWordForm,
  DeleteDefinitionsConfirm,
  EditWordPanel,
  VocabularyPagination,
  VocabularySearch,
  VocabularyStateBlock,
  VocabularyTable,
} from "@/features/vocabulary/components";
import { useVocabularyWords } from "@/features/vocabulary/hooks/useVocabularyWords";
import {
  getSelectableDefinitions,
  getSelectedDefinitions,
} from "@/features/vocabulary/lib/vocabularySelection";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

const EMPTY_DEFINITION_SELECTION = new Set<string>();

export default function VocabularyPage() {
  return (
    <RequireAuth>
      <VocabularyPageContent />
    </RequireAuth>
  );
}

type EditingTarget = {
  word: VocabWord;
  definitionId: string;
};

function VocabularyPageContent() {
  const { accessToken, clearSession, user } = useAuthSession();
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
    totalWords,
    updateWord,
    updatingDefinitionId,
    words,
  } = useVocabularyWords({
    accessToken,
    clearSession,
    isAuthenticated: Boolean(accessToken),
    search: debouncedSearch,
    userId: user?.id ?? null,
  });
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(
    null,
  );
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const selectionScope = `${debouncedSearch}:${offset}`;
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
    <PageShell fillViewport>
      <Panel className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            className="w-fit shrink-0"
            onClick={() => setIsAddWordOpen(true)}
          >
            Add word
          </Button>
          <VocabularySearch search={search} onSearchChange={setSearch} />
          {selectedDefinitions.length > 0 ? (
            <Button
              type="button"
              className="w-fit shrink-0 sm:ml-auto"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              Delete ({selectedDefinitions.length})
            </Button>
          ) : null}
        </div>

        {isAddWordOpen ? (
          <Modal
            title="Add word"
            description="Add a word to your vocabulary list."
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
            description="This action removes the selected definitions from your vocabulary."
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

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
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
                  isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"
                } transition-opacity duration-200`}
              >
                <VocabularyTable
                  allDefinitionsSelected={allDefinitionsSelected}
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
                itemCount={words.length}
                offset={offset}
                onNext={nextPage}
                onPrevious={previousPage}
                pageSize={pageSize}
                total={totalWords}
              />
            </div>
          ) : null}
        </div>
      </Panel>
    </PageShell>
  );
}
