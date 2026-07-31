"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { UserCollectionCardHeaderActions } from "@/features/collections/list/components/UserCollectionCardHeaderActions";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { CollectionReviewLink } from "@/features/collections/shared/components/CollectionReviewLink";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { formatCreatedLabel } from "@/shared/lib/date";
import { useLocale, useT } from "@/shared/providers/LocaleProvider";

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
  const t = useT();
  const { locale } = useLocale();
  const collectionId = collection?.id ?? null;
  const href = collection ? getCollectionPath(collection) : null;
  const { isLoading, stats } = useVocabStats({
    collectionId,
    enabled: true,
    isAuthenticated,
    userId,
  });
  const wordCountLabel =
    isLoading || stats == null
      ? "..."
      : `${stats.total} ${t("collections.words")}`;
  const description =
    collection?.description?.trim() || t("collections.noDescription");

  return (
    <CollectionCard
      createdLabel={formatCreatedLabel(collection?.createdAt, locale)}
      description={description}
      footerAction={
        collectionId ? (
          <CollectionReviewLink collectionId={collectionId} />
        ) : null
      }
      headerAction={
        collection ? (
          <UserCollectionCardHeaderActions
            collection={collection}
            deletingCollectionId={deletingCollectionId}
            onEdit={onEdit}
          />
        ) : null
      }
      href={href}
      isDisabled={!href || !collectionId || !collection}
      title={collection?.name ?? t("collections.myVocabulary")}
      wordCountLabel={wordCountLabel}
    />
  );
}
