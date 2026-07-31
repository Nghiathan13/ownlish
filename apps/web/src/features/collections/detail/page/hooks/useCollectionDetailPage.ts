"use client";

import { useMemo } from "react";
import { findCollectionById } from "@/entities/collection/lib/collectionDisplay";
import { useAuthSession, isAuthenticatedStatus } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";

type UseCollectionDetailPageParams = {
  collectionId: string;
};

export function useCollectionDetailPage({
  collectionId,
}: UseCollectionDetailPageParams) {
  const { status, user } = useAuthSession();
  const userId = user?.id ?? null;
  const isAuthenticated = isAuthenticatedStatus(status);
  const {
    collections,
    collectionsError,
    hasCollectionsList,
    reloadCollections,
  } = useCollectionsListQuery({
    isAuthenticated,
    userId,
  });
  const collectionSummary = useMemo(() => {
    return findCollectionById(collections, collectionId);
  }, [collectionId, collections]);
  const isNotFound =
    hasCollectionsList &&
    (!collectionSummary || collectionSummary.kind !== "USER") &&
    !collectionsError;

  return {
    collectionId,
    collectionName: collectionSummary?.name ?? null,
    collectionsError,
    hasCollectionsList,
    isNotFound,
    onReloadCollections: reloadCollections,
  };
}
