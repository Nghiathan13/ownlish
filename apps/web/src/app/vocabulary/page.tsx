"use client";

import { useEffect, useMemo, useState } from "react";
import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
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
  const [selectedDefinitionIds, setSelectedDefinitionIds] = useState<
    Set<string>
  >(() => new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

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

  useEffect(() => {
    setSelectedDefinitionIds(new Set());
  }, [debouncedSearch, offset]);

  function toggleDefinition(definitionId: string) {
    setSelectedDefinitionIds((currentIds) => {
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
    setSelectedDefinitionIds((currentIds) => {
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
    setSelectedDefinitionIds(new Set());
    setIsBulkDeleteOpen(false);
  }

  return (
    <PageShell>
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

        <div className="mt-6 overflow-hidden rounded-xl border border-border md:overflow-x-auto">
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
              className={`transition-opacity duration-200 ${
                isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"
              }`}
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

        <VocabularyPagination
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          itemCount={words.length}
          offset={offset}
          onNext={nextPage}
          onPrevious={previousPage}
          total={totalWords}
        />
      </Panel>
    </PageShell>
  );
}
