"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createVocabWord,
  listVocabWords,
  type CreateVocabWordInput,
  type VocabWord,
} from "@/entities/vocab/api/vocab";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { AddWordForm } from "@/features/vocabulary/components/AddWordForm";
import { ApiError, isUnauthorizedError } from "@/shared/api/http";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function VocabularyPage() {
  const router = useRouter();
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [words, setWords] = useState<VocabWord[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setIsLoadingWords(true);
        setLoadError(null);
      }
    });

    listVocabWords(accessToken)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setWords(response.items);
        setTotalWords(response.meta.total);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (isUnauthorizedError(error)) {
          clearSession();
          return;
        }

        setWords([]);
        setTotalWords(0);
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Cannot load vocabulary.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingWords(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearSession, status]);

  async function handleCreateWord(input: CreateVocabWordInput) {
    if (!accessToken) {
      return;
    }

    try {
      const createdWord = await createVocabWord(accessToken, input);

      setWords((currentWords) => [createdWord, ...currentWords]);
      setTotalWords((currentTotal) => currentTotal + 1);
      setLoadError(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearSession();
        return;
      }

      throw error;
    }
  }

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

        <AddWordForm onCreate={handleCreateWord} />

        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          {isLoadingWords ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading vocabulary...
            </div>
          ) : loadError ? (
            <div className="grid gap-4 p-6">
              <p className="text-sm text-danger">{loadError}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.location.reload()}
                className="w-fit"
              >
                Retry
              </Button>
            </div>
          ) : words.length === 0 ? (
            <div className="p-6">
              <h2 className="mb-2 text-xl font-semibold">
                No vocabulary yet.
              </h2>
              <p className="text-muted-foreground">
                Add word support comes next. This page is now connected to the
                backend.
              </p>
            </div>
          ) : (
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Word</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Meaning</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Next review</th>
                </tr>
              </thead>
              <tbody>
                {words.map((word) => (
                  <tr key={word.id} className="border-b border-border">
                    <td className="px-4 py-3 font-semibold">{word.word}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {word.type || "-"}
                    </td>
                    <td className="px-4 py-3">{word.meaningVi || "-"}</td>
                    <td className="px-4 py-3">{word.level}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(word.nextReview)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
