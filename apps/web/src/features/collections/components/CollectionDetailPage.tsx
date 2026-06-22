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
          <CollectionWordsPanel
            className="min-h-0 flex-1"
            collectionId={collectionSummary.id}
          />
        ) : isLoadingCollectionDetail ? (
          <p className="text-muted-foreground">Loading words...</p>
        ) : collectionDetailError ? (
          <StateMessage
            message={collectionDetailError}
            onRetry={reloadCollectionDetail}
          />
        ) : collectionDetail ? (
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
