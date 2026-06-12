"use client";

import { useState } from "react";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  AddWordForm,
  DeleteWordConfirm,
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

function VocabularyPageContent() {
  const { accessToken, clearSession, user } = useAuthSession();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const {
    canGoNext,
    canGoPrevious,
    createWord,
    deleteWord,
    deletingWordId,
    isInitialLoading,
    isRefreshing,
    loadError,
    nextPage,
    offset,
    previousPage,
    reload,
    totalWords,
    updateWord,
    updatingWordId,
    words,
  } = useVocabularyWords({
    accessToken,
    clearSession,
    isAuthenticated: Boolean(accessToken),
    search: debouncedSearch,
    userId: user?.id ?? null,
  });
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);
  const [wordPendingDelete, setWordPendingDelete] = useState<VocabWord | null>(
    null,
  );

  return (
    <PageShell>
      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vocabulary
            </p>
            <h1 className="mb-3 text-3xl font-bold leading-tight">
              Your vocabulary
            </h1>
            <p className="text-muted-foreground">
              {user?.email}
              {totalWords ? ` · ${totalWords} words` : ""}
            </p>
          </div>
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

        {editingWord ? (
          <Modal
            title="Edit word"
            description="Update the selected vocabulary word."
            onClose={() => setEditingWord(null)}
          >
            <EditWordPanel
              key={editingWord.id}
              isSubmitting={updatingWordId === editingWord.id}
              onClose={() => setEditingWord(null)}
              onUpdate={updateWord}
              word={editingWord}
            />
          </Modal>
        ) : null}

        <VocabularySearch search={search} onSearchChange={setSearch} />

        {wordPendingDelete ? (
          <Modal
            title="Delete word"
            description="This action removes the word from your vocabulary."
            onClose={() => setWordPendingDelete(null)}
          >
            <DeleteWordConfirm
              isDeleting={deletingWordId === wordPendingDelete.id}
              onCancel={() => setWordPendingDelete(null)}
              onConfirm={async (word) => {
                await deleteWord(word);
                setWordPendingDelete(null);
              }}
              word={wordPendingDelete}
            />
          </Modal>
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
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
                deletingWordId={deletingWordId}
                onDelete={setWordPendingDelete}
                onEdit={setEditingWord}
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
