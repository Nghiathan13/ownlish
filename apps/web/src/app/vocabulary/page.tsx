"use client";

import Link from "next/link";
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
    isLoadingWords,
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
          <Button type="button" onClick={clearSession}>
            Logout
          </Button>
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
          {isLoadingWords || loadError || words.length === 0 ? (
            <VocabularyStateBlock
              error={loadError}
              hasSearch={Boolean(debouncedSearch.trim())}
              isEmpty={words.length === 0}
              isLoading={isLoadingWords}
            />
          ) : (
            <VocabularyTable
              deletingWordId={deletingWordId}
              onDelete={setWordPendingDelete}
              onEdit={setEditingWord}
              words={words}
            />
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

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex text-sm font-semibold text-foreground underline underline-offset-4"
          >
            Back home
          </Link>
        </div>
      </Panel>
    </PageShell>
  );
}
