"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogDefinition, CatalogWord } from "@/entities/collection/api/collections";
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
        `Imported ${result.imported} words. Updated ${result.updated} existing words. Skipped ${result.skipped} words.`,
      );
    } catch {
      // The mutation state renders the error message.
    }
  }

  return (
    <PageShell>
      <Panel>
        <Link
          className="mb-4 inline-flex text-sm font-semibold text-muted-foreground transition hover:text-foreground"
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
        {words.map((word) => (
          <article
            className="rounded-lg border border-border bg-background p-4"
            key={word.id}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold">{word.word}</h2>
              {getFirstIpa(word.definitions) ? (
                <span className="text-sm text-muted-foreground">
                  {getFirstIpa(word.definitions)}
                </span>
              ) : null}
            </div>
            <DefinitionList definitions={word.definitions} />
          </article>
        ))}
      </div>

      <table className="hidden min-w-[880px] w-full border-collapse text-left text-sm md:table">
        <thead className="bg-surface shadow-[0_0.5px_0_0_var(--border)]">
          <tr>
            <th className="w-[180px] bg-surface px-4 py-3 font-semibold">Word</th>
            <th className="w-[140px] bg-surface px-4 py-3 font-semibold">IPA</th>
            <th className="bg-surface px-4 py-3 font-semibold">Type and meaning</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <tr className="border-b border-border align-top" key={word.id}>
              <td className="px-4 py-4 font-semibold">{word.word}</td>
              <td className="px-4 py-4 text-muted-foreground">
                {getFirstIpa(word.definitions) || "-"}
              </td>
              <td className="px-4 py-4">
                <DefinitionList definitions={word.definitions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DefinitionList({
  definitions,
}: {
  definitions: CatalogDefinition[];
}) {
  if (definitions.length === 0) {
    return <p className="text-sm text-muted-foreground">No meaning added.</p>;
  }

  return (
    <div className="grid gap-3">
      {definitions.map((definition) => (
        <div className="grid gap-1" key={definition.id}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-semibold">
              {definition.type || "-"}
            </span>
            {definition.band ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {definition.band}
              </span>
            ) : null}
          </div>
          <p className="text-sm">{definition.meaningVi || "No meaning added."}</p>
          {definition.example ? (
            <p className="text-sm text-muted-foreground">{definition.example}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function getFirstIpa(definitions: CatalogDefinition[]) {
  const definitionWithIpa = definitions.find(
    (definition) => definition.ipaUk || definition.ipaUs,
  );

  return definitionWithIpa?.ipaUk ?? definitionWithIpa?.ipaUs ?? null;
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
