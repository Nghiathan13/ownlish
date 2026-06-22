"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  findCollectionBySlug,
  getDefaultUserCollection,
  getUserOwnedCollections,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { SystemCollectionWordsPanel } from "@/features/collections/components/SystemCollectionWordsPanel";
import {
  useCollectionDetail,
  useCollectionsList,
  useImportCollection,
} from "@/features/collections/hooks/useCollections";
import { CollectionWordsPanel } from "@/features/collections/words/components/CollectionWordsPanel";
import { secondaryTextButtonClassName } from "@/shared/ui/button";
import { PageShell } from "@/shared/ui/PageShell";
import { Panel } from "@/shared/ui/Panel";

type CollectionDetailPageProps = {
  slug: string;
};

export function CollectionDetailPage({ slug }: CollectionDetailPageProps) {
  const { status, user } = useAuthSession();
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
    <PageShell fillViewport>
      <Panel className="flex min-h-0 flex-1 flex-col">
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
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            <SystemCollectionHeader collectionDetail={collectionDetail} />
            <SystemCollectionWordsPanel
              key={collectionDetail.id}
              className="min-h-0 flex-1"
              importError={importError}
              importResultMessage={importResultMessage}
              isImporting={isImporting}
              onImportClick={handleImportClick}
              onImportTargetChange={setImportTargetCollectionId}
              resolvedImportTargetCollectionId={resolvedImportTargetCollectionId}
              userOwnedCollections={userOwnedCollections}
              words={collectionDetail.catalogWords}
            />
          </div>
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

function SystemCollectionHeader({
  collectionDetail,
}: {
  collectionDetail: NonNullable<ReturnType<typeof useCollectionDetail>["collectionDetail"]>;
}) {
  return (
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
