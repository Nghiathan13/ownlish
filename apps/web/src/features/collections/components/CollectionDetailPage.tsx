"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CatalogWord } from "@/entities/collection/api/collections";
import {
  findCollectionBySlug,
  getDefaultUserCollection,
  getUserOwnedCollections,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { CatalogWordsTable } from "@/features/collections/components/CatalogWordsTable";
import { ImportTargetCollectionSelect } from "@/features/collections/components/ImportTargetCollectionSelect";
import {
  useCollectionDetail,
  useCollectionsList,
  useImportCollection,
} from "@/features/collections/hooks/useCollections";
import { CollectionWordsPanel } from "@/features/collections/words/components/CollectionWordsPanel";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";
import { TextInput } from "@/shared/ui/TextInput";

type CollectionDetailPageProps = {
  slug: string;
};

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const { status, user } = useAuthSession();
  const [wordSearch, setWordSearch] = useState("");
  const [importResultMessage, setImportResultMessage] = useState<string | null>(
    null,
  );
  const [importTargetCollectionId, setImportTargetCollectionId] = useState<
    string | null
  >(null);
  const authParams = {
    isAuthenticated: isAuthenticatedStatus(status),
    userId: user?.id ?? null,
  };
  const { collections, collectionsError, isLoadingCollections, reloadCollections } =
    useCollectionsList(authParams);
  const collectionSummary = useMemo(() => {
    return findCollectionBySlug(collections, slug);
  }, [collections, slug]);
  const isUserCollection = collectionSummary?.kind === "USER";
  const {
    collectionDetail,
    collectionDetailError,
    isLoadingCollectionDetail,
    reloadCollectionDetail,
  } = useCollectionDetail({
    ...authParams,
    collectionId:
      collectionSummary?.kind === "SYSTEM" ? collectionSummary.id : null,
  });
  const { importCollection, importError, isImporting, resetImportState } =
    useImportCollection({
      userId: user?.id ?? null,
    });
  const userOwnedCollections = useMemo(() => {
    return getUserOwnedCollections(collections);
  }, [collections]);
  const defaultCollection = useMemo(() => {
    return getDefaultUserCollection(collections);
  }, [collections]);
  const resolvedImportTargetCollectionId =
    importTargetCollectionId ?? defaultCollection?.id ?? null;
  const isSystemCollection = collectionSummary?.kind === "SYSTEM";
  const filteredWords = useMemo(() => {
    const words = collectionDetail?.catalogWords ?? [];
    const search = wordSearch.trim().toLowerCase();

    if (!search) {
      return words;
    }

    return words.filter((word) => word.word.toLowerCase().includes(search));
  }, [collectionDetail, wordSearch]);

  async function handleImportClick() {
    if (!collectionSummary || !resolvedImportTargetCollectionId) return;

    setImportResultMessage(null);
    resetImportState();

    try {
      const result = await importCollection({
        systemCollectionId: collectionSummary.id,
        targetCollectionId: resolvedImportTargetCollectionId,
      });
      const targetCollection =
        userOwnedCollections.find(
          (collection) => collection.id === resolvedImportTargetCollectionId,
        ) ?? null;
      const targetName = targetCollection?.isDefault
        ? "My Vocabulary"
        : (targetCollection?.name ?? "your collection");
      setImportResultMessage(
        `Imported ${result.imported} words into ${targetName}. Updated ${result.updated} existing words. Skipped ${result.skipped} words.`,
      );
    } catch {
      // The mutation state renders the error message.
    }
  }

  return (
    <PageShell fillViewport={isUserCollection}>
      <Panel
        className={
          isUserCollection ? "flex min-h-0 flex-1 flex-col" : undefined
        }
      >
        <BackToCollectionsLink />

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
        ) : isUserCollection ? (
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <UserCollectionHeader collection={collectionSummary} />
            <CollectionWordsPanel
              className="min-h-0 flex-1"
              collectionId={collectionSummary.id}
            />
          </div>
        ) : isLoadingCollectionDetail ? (
          <p className="text-muted-foreground">Loading words...</p>
        ) : collectionDetailError ? (
          <StateMessage
            message={collectionDetailError}
            onRetry={reloadCollectionDetail}
          />
        ) : collectionDetail ? (
          <SystemCollectionDetail
            collectionDetail={collectionDetail}
            filteredWords={filteredWords}
            importError={importError}
            importResultMessage={importResultMessage}
            isImporting={isImporting}
            isSystemCollection={isSystemCollection}
            onImportClick={handleImportClick}
            onWordSearchChange={setWordSearch}
            resolvedImportTargetCollectionId={resolvedImportTargetCollectionId}
            userOwnedCollections={userOwnedCollections}
            wordSearch={wordSearch}
            onImportTargetChange={setImportTargetCollectionId}
          />
        ) : null}
      </Panel>
    </PageShell>
  );
}

function BackToCollectionsLink() {
  return (
    <Link
      className="mb-4 inline-flex text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      href="/collections"
    >
      Back to collections
    </Link>
  );
}

function UserCollectionHeader({
  collection,
}: {
  collection: NonNullable<ReturnType<typeof findCollectionBySlug>>;
}) {
  const title = collection.isDefault ? "My Vocabulary" : collection.name;
  const description =
    collection.description ??
    (collection.isDefault
      ? "All words in your personal vocabulary list."
      : `Review ${collection.itemCount} words in this collection.`);

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {collection.isDefault ? "Default" : "My collection"}
      </p>
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
    </div>
  );
}

function SystemCollectionDetail({
  collectionDetail,
  filteredWords,
  importError,
  importResultMessage,
  isImporting,
  isSystemCollection,
  onImportClick,
  onImportTargetChange,
  onWordSearchChange,
  resolvedImportTargetCollectionId,
  userOwnedCollections,
  wordSearch,
}: {
  collectionDetail: NonNullable<ReturnType<typeof useCollectionDetail>["collectionDetail"]>;
  filteredWords: CatalogWord[];
  importError: string | null;
  importResultMessage: string | null;
  isImporting: boolean;
  isSystemCollection: boolean;
  onImportClick: () => void;
  onImportTargetChange: (collectionId: string) => void;
  onWordSearchChange: (value: string) => void;
  resolvedImportTargetCollectionId: string | null;
  userOwnedCollections: ReturnType<typeof getUserOwnedCollections>;
  wordSearch: string;
}) {
  return (
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
        {isSystemCollection ? (
          <div className="grid w-full max-w-md gap-4">
            {userOwnedCollections.length > 0 &&
            resolvedImportTargetCollectionId ? (
              <ImportTargetCollectionSelect
                collections={userOwnedCollections}
                onChange={onImportTargetChange}
                value={resolvedImportTargetCollectionId}
              />
            ) : null}
            <button
              className={primaryTextButtonClassName("w-fit")}
              disabled={isImporting || !resolvedImportTargetCollectionId}
              onClick={() => {
                void onImportClick();
              }}
              type="button"
            >
              {isImporting ? "Importing..." : "Import collection"}
            </button>
          </div>
        ) : null}
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
          onChange={(event) => onWordSearchChange(event.target.value)}
          placeholder="Search English word"
          value={wordSearch}
        />
        <p className="text-sm text-muted-foreground">
          {filteredWords.length} of {collectionDetail.itemCount} words
        </p>
      </div>

      {filteredWords.length === 0 ? (
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-2 text-xl font-semibold">No matching words.</h2>
          <p className="text-muted-foreground">
            Try a different English search term.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="max-h-[min(70vh,48rem)] overflow-auto">
            <CatalogWordsTable words={filteredWords} />
          </div>
        </div>
      )}
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
      <button
        className={secondaryTextButtonClassName("w-fit")}
        onClick={() => {
          void onRetry();
        }}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
