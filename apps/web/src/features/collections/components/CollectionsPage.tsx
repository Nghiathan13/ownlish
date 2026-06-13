"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useCollections } from "@/features/collections/hooks/useCollections";
import { classNames } from "@/shared/lib/classNames";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";
import { TextInput } from "@/shared/ui/TextInput";

const previewLimit = 24;

export function CollectionsPage() {
  const { accessToken, clearSession, status, user } = useAuthSession();
  const [wordSearch, setWordSearch] = useState("");
  const {
    collectionDetail,
    collectionDetailError,
    collections,
    collectionsError,
    importCollection,
    importError,
    importResultMessage,
    isImporting,
    isLoadingCollectionDetail,
    isLoadingCollections,
    reloadCollectionDetail,
    reloadCollections,
    resetImportState,
    selectedCollectionId,
    setSelectedCollectionId,
  } = useCollections({
    accessToken,
    clearSession,
    isAuthenticated: status === "authenticated",
    userId: user?.id ?? null,
  });
  const filteredWords = useMemo(() => {
    const words = collectionDetail?.catalogWords ?? [];
    const search = wordSearch.trim().toLowerCase();

    if (!search) {
      return words;
    }

    return words.filter((word) => {
      return (
        word.word.toLowerCase().includes(search) ||
        word.definitions.some((definition) =>
          (definition.meaningVi ?? "").toLowerCase().includes(search),
        )
      );
    });
  }, [collectionDetail, wordSearch]);
  const previewWords = filteredWords.slice(0, previewLimit);

  return (
    <PageShell>
      <Panel>
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Collections
          </p>
          <h1 className="mb-3 text-3xl font-bold leading-tight">
            Built-in word sets
          </h1>
          <p className="text-muted-foreground">
            Start from Oxford A1-C1 collections, then import the set you want to
            review into your vocabulary.
          </p>
        </div>

        {isLoadingCollections ? (
          <p className="text-muted-foreground">Loading collections...</p>
        ) : collectionsError ? (
          <StateMessage message={collectionsError} onRetry={reloadCollections} />
        ) : collections.length === 0 ? (
          <StateMessage
            message="No collections found. Seed the Oxford catalog first."
            onRetry={reloadCollections}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="grid gap-3 self-start">
              {collections.map((collection) => {
                const isSelected = collection.id === selectedCollectionId;

                return (
                  <button
                    className={classNames(
                      "rounded-xl border p-4 text-left transition hover:bg-muted",
                      isSelected
                        ? "border-foreground bg-muted"
                        : "border-border bg-transparent",
                    )}
                    key={collection.id}
                    onClick={() => {
                      resetImportState();
                      setWordSearch("");
                      setSelectedCollectionId(collection.id);
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{collection.name}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {collection.itemCount} words
                        </p>
                      </div>
                      {collection.cefrLevel ? (
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">
                          {collection.cefrLevel}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-border p-4 sm:p-5">
              {isLoadingCollectionDetail ? (
                <p className="text-muted-foreground">Loading collection...</p>
              ) : collectionDetailError ? (
                <StateMessage
                  message={collectionDetailError}
                  onRetry={reloadCollectionDetail}
                />
              ) : collectionDetail ? (
                <div className="grid gap-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {collectionDetail.cefrLevel ?? collectionDetail.source}
                      </p>
                      <h2 className="text-2xl font-bold">
                        {collectionDetail.name}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {collectionDetail.description}
                      </p>
                    </div>
                    <Button
                      disabled={isImporting}
                      onClick={() => {
                        resetImportState();
                        void importCollection(collectionDetail.id);
                      }}
                      type="button"
                    >
                      {isImporting ? "Importing..." : "Import set"}
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
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      htmlFor="collection-word-search"
                    >
                      Search this set
                    </label>
                    <TextInput
                      id="collection-word-search"
                      onChange={(event) => setWordSearch(event.target.value)}
                      placeholder="Search word or meaning..."
                      value={wordSearch}
                    />
                    <p className="text-sm text-muted-foreground">
                      {filteredWords.length} of {collectionDetail.itemCount} words
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {previewWords.map((word) => {
                      const firstDefinition = word.definitions[0];

                      return (
                        <article
                          className="rounded-lg border border-border p-4"
                          key={word.id}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-semibold">{word.word}</h3>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {firstDefinition?.type ?? "-"}
                              </p>
                            </div>
                            {firstDefinition?.ipaUk ? (
                              <p className="text-sm text-muted-foreground">
                                {firstDefinition.ipaUk}
                              </p>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm">
                            {firstDefinition?.meaningVi ?? "No meaning added."}
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

                  {filteredWords.length > previewLimit ? (
                    <p className="text-sm text-muted-foreground">
                      Showing {previewLimit} of {filteredWords.length} matching
                      words. Import adds the full set to your vocabulary.
                    </p>
                  ) : filteredWords.length === 0 ? (
                    <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      No words match this search.
                    </p>
                  ) : null}

                  <Link
                    className="text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                    href="/vocabulary"
                  >
                    View your vocabulary
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Panel>
    </PageShell>
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
