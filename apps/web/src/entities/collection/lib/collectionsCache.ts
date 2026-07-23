import type { QueryClient } from "@tanstack/react-query";
import { getReviewQueueUserQueryKey } from "@/entities/vocab/lib/reviewQueueCache";
import { getVocabUserQueryKey } from "@/entities/vocab/lib/vocabCache";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";

export function getCollectionsQueryKey(userId: string | null) {
  return ["collections", { userId }] as const;
}

export function getCollectionDetailQueryKey(
  userId: string | null,
  collectionId: string | null,
) {
  return ["collection", { userId, collectionId }] as const;
}

export function getCollectionCatalogWordsQueryKey(
  userId: string | null,
  collectionId: string | null,
  offset: number,
  limit: number,
) {
  return ["collection-catalog-words", { userId, collectionId, offset, limit }] as const;
}

export function getOxfordCollectionMetaQueryKey(
  userId: string | null,
  band: string,
) {
  return ["oxford-collection-meta", { userId, band }] as const;
}

export function getOxfordPartQueryKey(
  userId: string | null,
  band: string,
  part: number,
) {
  return ["oxford-part", { userId, band, part }] as const;
}

export function invalidateCollectionsList(
  queryClient: QueryClient,
  userId: string | null,
) {
  void queryClient.invalidateQueries({
    queryKey: getCollectionsQueryKey(userId),
  });
}

export function invalidateCollectionDetail(
  queryClient: QueryClient,
  userId: string | null,
  collectionId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: getCollectionDetailQueryKey(userId, collectionId),
  });
}

export function invalidateImportedVocabulary(
  queryClient: QueryClient,
  userId: string | null,
) {
  void queryClient.invalidateQueries({
    queryKey: getVocabUserQueryKey(userId),
  });
  void queryClient.invalidateQueries({
    queryKey: getReviewQueueUserQueryKey(userId),
  });
  void queryClient.invalidateQueries({
    queryKey: getVocabStatsQueryKey(userId),
  });
}

export function invalidateCollectionMutationQueries(
  queryClient: QueryClient,
  userId: string | null,
) {
  invalidateCollectionsList(queryClient, userId);
  invalidateImportedVocabulary(queryClient, userId);
}
