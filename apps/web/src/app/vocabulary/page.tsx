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
        </div>

        <AddWordForm onCreate={createWord} />

        {editingWord ? (
          <EditWordPanel
            key={editingWord.id}
            isSubmitting={updatingWordId === editingWord.id}
            onClose={() => setEditingWord(null)}
            onUpdate={updateWord}
            word={editingWord}
          />
        ) : null}

        <VocabularySearch search={search} onSearchChange={setSearch} />

        {wordPendingDelete ? (
          <DeleteWordConfirm
            isDeleting={deletingWordId === wordPendingDelete.id}
            onCancel={() => setWordPendingDelete(null)}
            onConfirm={async (word) => {
              await deleteWord(word);
              setWordPendingDelete(null);
            }}
            word={wordPendingDelete}
          />
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          {isInitialLoading || loadError || words.length === 0 ? (
            <VocabularyStateBlock
              error={loadError}
              hasSearch={Boolean(debouncedSearch.trim())}
              isEmpty={words.length === 0}
              isLoading={isInitialLoading}
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
