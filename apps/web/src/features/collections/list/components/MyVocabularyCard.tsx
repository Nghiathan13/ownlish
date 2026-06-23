"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { CollectionReviewLink } from "@/features/collections/shared/components/CollectionReviewLink";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";

type MyVocabularyCardProps = {
  collection: CollectionSummary | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function MyVocabularyCard({
  collection,
  isAuthenticated,
  userId,
}: MyVocabularyCardProps) {
  const collectionId = collection?.id ?? null;
  const href = collection ? getCollectionPath(collection) : null;
  const { isLoading, stats } = useVocabStats({
    collectionId,
    isAuthenticated,
    userId,
  });
  const wordCountLabel =
    isLoading || stats == null ? "..." : `${stats.total} words`;

  return (
    <CollectionCard
      description={collection?.description ?? null}
      footerAction={
        collectionId
          ? (
            <CollectionReviewLink
              collectionId={collectionId}
              isAuthenticated={isAuthenticated}
              userId={userId}
            />
          )
          : null
      }
      href={href}
      isDisabled={!href || !collectionId || !collection}
      title="My Vocabulary"
      wordCountLabel={wordCountLabel}
    />
  );
}
