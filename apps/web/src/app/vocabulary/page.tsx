"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VocabWord } from "@/entities/vocab/api/vocab";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { AddWordForm } from "@/features/vocabulary/components/AddWordForm";
import { EditWordPanel } from "@/features/vocabulary/components/EditWordPanel";
import { VocabularyStateBlock } from "@/features/vocabulary/components/VocabularyStateBlock";
import { VocabularyTable } from "@/features/vocabulary/components/VocabularyTable";
import { useVocabularyWords } from "@/features/vocabulary/hooks/useVocabularyWords";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

export default function VocabularyPage() {
  const router = useRouter();
  const { accessToken, clearSession, status, user } = useAuthSession();
  const {
    createWord,
    deleteWord,
    deletingWordId,
    isLoadingWords,
    loadError,
    totalWords,
    updateWord,
    updatingWordId,
    words,
  } = useVocabularyWords({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
  });
  const [editingWord, setEditingWord] = useState<VocabWord | null>(null);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "checking") {
    return (
      <PageShell>
        <Panel>
          <p className="text-muted-foreground">Checking your session...</p>
        </Panel>
      </PageShell>
    );
  }

  if (status === "guest") {
    return null;
  }

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
            onCancel={() => setEditingWord(null)}
            onUpdate={updateWord}
            word={editingWord}
          />
        ) : null}

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          {isLoadingWords || loadError || words.length === 0 ? (
            <VocabularyStateBlock
              error={loadError}
              isEmpty={words.length === 0}
              isLoading={isLoadingWords}
            />
          ) : (
            <VocabularyTable
              deletingWordId={deletingWordId}
              onDelete={deleteWord}
              onEdit={setEditingWord}
              words={words}
            />
          )}
        </div>

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
