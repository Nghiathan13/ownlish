"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  findCollectionById,
  getCollectionPath,
  getDefaultUserCollection,
  getUserOwnedCollections,
  parseCollectionKindHint,
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

type CollectionDetailContentProps = {
  collectionId: string;
  onMounted?: () => void;
};

export function CollectionDetailContent({
  collectionId,
  onMounted,
}: CollectionDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kindHint = parseCollectionKindHint(searchParams.get("kind"));
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
  const {
    collections,
    collectionsError,
    hasCollectionsList,
    reloadCollections,
  } = useCollectionsList(authParams);
  const collectionSummary = useMemo(() => {
    return findCollectionById(collections, collectionId);
  }, [collectionId, collections]);
  const isSystemCollection =
    collectionSummary?.kind === "SYSTEM" ||
    (collectionSummary == null && kindHint === "SYSTEM");
  const {
    collectionDetail,
    collectionDetailError,
    isLoadingCollectionDetail,
    reloadCollectionDetail,
  } = useCollectionDetail({
    ...authParams,
    collectionId,
    enabled: isSystemCollection,
  });
  const isNotFound =
    hasCollectionsList && !collectionSummary && !collectionsError;
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

  useEffect(() => {
    onMounted?.();
  }, [onMounted]);

  function handleUserCollectionChange(nextCollectionId: string) {
    if (nextCollectionId === collectionId) {
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
    if (!isSystemCollection || !resolvedImportTargetCollectionId) return;

    setImportResultMessage(null);
    resetImportState();

    try {
      const result = await importCollection({
        systemCollectionId: collectionId,
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

  if (collectionsError && !hasCollectionsList) {
    return (
      <div className="px-4">
        <StateMessage message={collectionsError} onRetry={reloadCollections} />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-4 rounded-xl border border-border p-6">
        <h1 className="mb-2 text-xl font-semibold">Collection not found.</h1>
        <p className="text-muted-foreground">
          Go back to collections and choose an available set.
        </p>
      </div>
    );
  }

  if (isSystemCollection) {
    return (
      <SystemCollectionWordsPanel
        hasCollectionsList={hasCollectionsList}
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
    );
  }

  return (
    <CollectionWordsPanel
      collectionId={collectionId}
      hasCollectionsList={hasCollectionsList}
      onCollectionChange={handleUserCollectionChange}
      userCollections={userOwnedCollections}
    />
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
