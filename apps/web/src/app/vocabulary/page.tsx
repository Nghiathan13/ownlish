"use client";

import { useState } from "react";
import type { VocabWord, VocabWordDefinition } from "@/entities/vocab/api/vocab";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  AddWordForm,
  DeleteDefinitionConfirm,
  EditWordPanel,
  VocabularyPagination,
  VocabularySearch,
  VocabularyStateBlock,
  VocabularyTable,
} from "@/features/vocabulary/components";
import { useVocabularyWords } from "@/features/vocabulary/hooks/useVocabularyWords";
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
    deleteDefinition,
    deletingDefinitionId,
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
  const [definitionPendingDelete, setDefinitionPendingDelete] = useState<{
    word: VocabWord;
    definition: VocabWordDefinition;
  } | null>(null);

  return (
    <PageShell>
      <Panel>
        <div className="flex justify-end">
          <Button type="button" onClick={() => setIsAddWordOpen(true)}>
            Add word
          </Button>
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

        <VocabularySearch search={search} onSearchChange={setSearch} />

        {definitionPendingDelete ? (
          <Modal
            title="Delete definition"
            description="This action removes the selected definition from your vocabulary."
            onClose={() => setDefinitionPendingDelete(null)}
          >
            <DeleteDefinitionConfirm
              definition={definitionPendingDelete.definition}
              isDeleting={
                deletingDefinitionId === definitionPendingDelete.definition.id
              }
              onCancel={() => setDefinitionPendingDelete(null)}
              onConfirm={async (word, definition) => {
                await deleteDefinition({ word, definition });
                setDefinitionPendingDelete(null);
              }}
              word={definitionPendingDelete.word}
            />
          </Modal>
        ) : null}

        <div className="mt-8 md:overflow-x-auto">
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
                deletingDefinitionId={deletingDefinitionId}
                onDelete={(word, definition) => {
                  setDefinitionPendingDelete({ word, definition });
                }}
                onEdit={(word, definition) => {
                  if (definition) {
                    setEditingTarget({
                      word,
                      definitionId: definition.id,
                    });
                  }
                }}
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
