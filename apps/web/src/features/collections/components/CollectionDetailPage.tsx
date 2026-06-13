"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogWord } from "@/entities/collection/api/collections";
import { findCollectionBySlug } from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import {
  useCollectionDetail,
  useCollectionsList,
  useImportCollection,
} from "@/features/collections/hooks/useCollections";
import { Button } from "@/shared/ui/Button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { TextInput } from "@/shared/ui/TextInput";

type CollectionDetailPageProps = {
  slug: string;
};

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [wordSearch, setWordSearch] = useState("");
  const [importResultMessage, setImportResultMessage] = useState<string | null>(
    null,
  );
  const authParams = {
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  };
  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsList(authParams);
  const collectionSummary = useMemo(() => {
    return findCollectionBySlug(collections, slug);
  }, [collections, slug]);
  const {
    collectionDetail,
    collectionDetailError,
    isLoadingCollectionDetail,
    reloadCollectionDetail,
  } = useCollectionDetail({
    ...authParams,
    collectionId: collectionSummary?.id ?? null,
  });
  const { importCollection, importError, isImporting, resetImportState } =
    useImportCollection({
      accessToken,
      clearSession,
      userId: user?.id ?? null,
    });
  const filteredWords = useMemo(() => {
    const words = collectionDetail?.catalogWords ?? [];
    const search = wordSearch.trim().toLowerCase();

    if (!search) {
      return words;
    }

    return words.filter((word) => word.word.toLowerCase().includes(search));
  }, [collectionDetail, wordSearch]);

  async function handleImportClick() {
    if (!collectionSummary) return;

    setImportResultMessage(null);
    resetImportState();

    try {
      const result = await importCollection(collectionSummary.id);
      setImportResultMessage(
        `Imported ${result.imported} words. Skipped ${result.skipped} existing words.`,
      );
    } catch {
      // The mutation state renders the error message.
    }
  }

  return (
    <PageShell>
      <Panel>
        <Link
          className="mb-6 inline-flex text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          href="/collections"
        >
          Back to collections
        </Link>

        {isLoadingCollections ? (
          <p className="text-muted-foreground">Loading collection...</p>
        ) : collectionsError ? (
          <StateMessage message={collectionsError} onRetry={reloadCollections} />
        ) : !collectionSummary ? (
          <div className="rounded-xl border border-border p-6">
            <h1 className="mb-2 text-xl font-semibold">Collection not found.</h1>
            <p className="text-muted-foreground">
              Go back to collections and choose an available set.
            </p>
          </div>
        ) : isLoadingCollectionDetail ? (
          <p className="text-muted-foreground">Loading words...</p>
        ) : collectionDetailError ? (
          <StateMessage
            message={collectionDetailError}
            onRetry={reloadCollectionDetail}
          />
        ) : collectionDetail ? (
          <div className="grid gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {collectionDetail.cefrLevel ?? collectionDetail.source}
                </p>
                <h1 className="text-3xl font-bold leading-tight">
                  {collectionDetail.name}
                </h1>
                <p className="mt-2 max-w-3xl text-muted-foreground">
                  {collectionDetail.description}
                </p>
              </div>
              <Button
                className="w-fit"
                disabled={isImporting}
                onClick={() => {
                  void handleImportClick();
                }}
                type="button"
              >
                {isImporting ? "Importing..." : "Import collection"}
              </Button>
            </div>

            {importResultMessage ? (
              <p className="rounded-lg border border-border bg-muted p-3 text-sm">
                {importResultMessage}
              </p>
            ) : null}
            {importError ? (
              <p className="rounded-lg border border-border p-3 text-sm text-danger">
                {importError}
              </p>
            ) : null}

            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-foreground"
                htmlFor="collection-word-search"
              >
                Search
              </label>
              <TextInput
                id="collection-word-search"
                onChange={(event) => setWordSearch(event.target.value)}
                placeholder="Search English word"
                value={wordSearch}
              />
              <p className="text-sm text-muted-foreground">
                {filteredWords.length} of {collectionDetail.itemCount} words
              </p>
            </div>

            {filteredWords.length === 0 ? (
              <div className="rounded-xl border border-border p-6">
                <h2 className="mb-2 text-xl font-semibold">
                  No matching words.
                </h2>
                <p className="text-muted-foreground">
                  Try a different English search term.
                </p>
              </div>
            ) : (
              <CollectionWordsTable words={filteredWords} />
            )}
          </div>
        ) : null}
      </Panel>
    </PageShell>
  );
}

function CollectionWordsTable({ words }: { words: CatalogWord[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="grid gap-3 p-3 md:hidden">
        {words.map((word) => {
          const firstDefinition = word.definitions[0];

          return (
            <article
              className="rounded-lg border border-border bg-background p-4"
              key={word.id}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{word.word}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {firstDefinition?.type || "-"}
                  </p>
                </div>
                {firstDefinition?.ipaUk ? (
                  <span className="text-sm text-muted-foreground">
                    {firstDefinition.ipaUk}
                  </span>
                ) : null}
              </div>
              <p className="text-sm">
                {firstDefinition?.meaningVi || "No meaning added."}
              </p>
              {firstDefinition?.example ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {firstDefinition.example}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <table className="hidden min-w-[880px] w-full border-collapse text-left text-sm md:table">
        <thead className="border-b border-border bg-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Word</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">IPA</th>
            <th className="px-4 py-3 font-semibold">Meaning</th>
            <th className="px-4 py-3 font-semibold">Example</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => {
            const firstDefinition = word.definitions[0];

            return (
              <tr className="border-b border-border" key={word.id}>
                <td className="px-4 py-3 font-semibold">{word.word}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {firstDefinition?.type || "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {firstDefinition?.ipaUk || firstDefinition?.ipaUs || "-"}
                </td>
                <td className="px-4 py-3">
                  {firstDefinition?.meaningVi || "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {firstDefinition?.example || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StateMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button
        className="w-fit"
        onClick={() => {
          void onRetry();
        }}
        type="button"
        variant="secondary"
      >
        Retry
      </Button>
    </div>
  );
}
