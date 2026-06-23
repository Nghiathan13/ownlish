"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { CollectionReviewLink } from "@/features/collections/shared/components/CollectionReviewLink";
import { UserCollectionCardHeaderActions } from "@/features/collections/list/components/UserCollectionCardHeaderActions";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { formatCreatedLabel } from "@/shared/lib/date";

type MyVocabularyCardProps = {
  collection: CollectionSummary | null;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  onEdit: (collection: CollectionSummary) => void;
  userId: string | null;
};

export function MyVocabularyCard({
  collection,
  deletingCollectionId,
  isAuthenticated,
  onEdit,
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
  const description = collection?.description?.trim() || "No description.";

  return (
    <CollectionCard
      createdLabel={formatCreatedLabel(collection?.createdAt)}
      description={description}
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
      headerAction={
        collection
          ? (
            <UserCollectionCardHeaderActions
              collection={collection}
              deletingCollectionId={deletingCollectionId}
              onEdit={onEdit}
            />
          )
          : null
      }
      href={href}
      isDisabled={!href || !collectionId || !collection}
      title={collection?.name ?? "My Vocabulary"}
      wordCountLabel={wordCountLabel}
    />
  );
}
