"use client";

import { useMemo } from "react";
import { findCollectionById, useCollectionsListQuery } from "@/entities/collection";
import { useAuthSession, isAuthenticatedStatus } from "@/entities/session";

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
