"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { CatalogWord } from "@/entities/collection/api/collections";
import {
  findCollectionById,
  getCollectionPath,
  getDefaultUserCollection,
  getUserOwnedCollections,
  parseCollectionKindHint,
} from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import {
  useCollectionDetail,
  useCollectionsList,
  useImportCollection,
} from "@/features/collections/shared/hooks/useCollections";

type UseCollectionDetailPageParams = {
  collectionId: string;
};

export function useCollectionDetailPage({
  collectionId,
}: UseCollectionDetailPageParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kindHint = parseCollectionKindHint(searchParams.get("kind"));
  const { status, user } = useAuthSession();
  const userId = user?.id ?? null;
  const isAuthenticated = isAuthenticatedStatus(status);
  const [importResultMessage, setImportResultMessage] = useState<string | null>(
    null,
  );
  const [importTargetCollectionId, setImportTargetCollectionId] = useState<
    string | null
  >(null);
  const authParams = {
    isAuthenticated,
    userId,
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
      userId,
    });
  const userOwnedCollections = useMemo(() => {
    return getUserOwnedCollections(collections);
  }, [collections]);
  const defaultCollection = useMemo(() => {
    return getDefaultUserCollection(collections);
  }, [collections]);
  const resolvedImportTargetCollectionId =
    importTargetCollectionId ?? defaultCollection?.id ?? null;

  const handleUserCollectionChange = useCallback(
    (nextCollectionId: string) => {
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
    },
    [collectionId, router, userOwnedCollections],
  );

  const handleImportClick = useCallback(
    async (catalogDefinitionIds?: string[]) => {
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
        // importError is rendered by the body.
      }
    },
    [
      collectionId,
      importCollection,
      isSystemCollection,
      resetImportState,
      resolvedImportTargetCollectionId,
      userOwnedCollections,
    ],
  );

  return {
    catalogWords: collectionDetail?.catalogWords ?? ([] as CatalogWord[]),
    collectionId,
    collectionsError,
    hasCollectionsList,
    importError,
    importResultMessage,
    isImporting,
    isLoadingCollectionDetail,
    isNotFound,
    isSystemCollection,
    loadError: collectionDetailError,
    onImportClick: handleImportClick,
    onImportTargetChange: setImportTargetCollectionId,
    onReloadCollectionDetail: reloadCollectionDetail,
    onReloadCollections: reloadCollections,
    onUserCollectionChange: handleUserCollectionChange,
    resolvedImportTargetCollectionId,
    userOwnedCollections,
  };
}