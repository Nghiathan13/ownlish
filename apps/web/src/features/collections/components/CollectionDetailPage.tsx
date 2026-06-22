"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  findCollectionById,
  getCollectionPath,
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
import { iconTextButtonClassName, secondaryTextButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { PageShell } from "@/shared/ui/PageShell";

type CollectionDetailPageProps = {
  collectionId: string;
};

export function CollectionDetailPage({ collectionId }: CollectionDetailPageProps) {
  const router = useRouter();
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
    return findCollectionById(collections, collectionId);
  }, [collectionId, collections]);
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

  function handleUserCollectionChange(nextCollectionId: string) {
    if (nextCollectionId === collectionSummary?.id) {
      return;
    }

    const nextCollection = userOwnedCollections.find(
      (collection) => collection.id === nextCollectionId,
    );

    if (!nextCollection) {
      return;
    }

    router.push(getCollectionPath(nextCollection));
  }

  async function handleImportClick(catalogDefinitionIds?: string[]) {
    if (!collectionSummary || !resolvedImportTargetCollectionId) return;

    setImportResultMessage(null);
    resetImportState();

    try {
      const result = await importCollection({
        systemCollectionId: collectionSummary.id,
        targetCollectionId: resolvedImportTargetCollectionId,
        catalogDefinitionIds,
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
      <BackToCollectionsButton />

      {isLoadingCollections ? (
        <p className="px-4 text-muted-foreground">Loading collection...</p>
      ) : collectionsError ? (
        <div className="px-4">
          <StateMessage message={collectionsError} onRetry={reloadCollections} />
        </div>
      ) : !collectionSummary ? (
        <div className="mx-4 rounded-xl border border-border p-6">
          <h1 className="mb-2 text-xl font-semibold">Collection not found.</h1>
          <p className="text-muted-foreground">
            Go back to collections and choose an available set.
          </p>
        </div>
      ) : isUserCollection ? (
        <CollectionWordsPanel
          className="min-h-0 flex-1"
          collectionId={collectionSummary.id}
          onCollectionChange={handleUserCollectionChange}
          userCollections={userOwnedCollections}
        />
      ) : (
        <SystemCollectionWordsPanel
          className="min-h-0 flex-1"
          importError={importError}
          importResultMessage={importResultMessage}
          isImporting={isImporting}
          isLoading={isLoadingCollectionDetail}
          loadError={collectionDetailError}
          onImportClick={handleImportClick}
          onImportTargetChange={setImportTargetCollectionId}
          onRetry={reloadCollectionDetail}
          resolvedImportTargetCollectionId={resolvedImportTargetCollectionId}
          userOwnedCollections={userOwnedCollections}
          words={collectionDetail?.catalogWords ?? []}
        />
      )}
    </PageShell>
  );
}

function BackToCollectionsButton() {
  const router = useRouter();

  return (
    <div className="mb-4 px-4">
      <button
        className={iconTextButtonClassName(
          "w-fit shrink-0",
          "border-foreground bg-foreground text-background",
        )}
        onClick={() => {
          router.push("/collections");
        }}
        type="button"
      >
        <ArrowBackIcon />
        Back to collections
      </button>
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
