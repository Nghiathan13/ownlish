"use client";

import type { CollectionSummary } from "@/entities/collection";
import { getCollectionPath } from "@/entities/collection";
import { runAuthenticatedRequest } from "@/entities/session";
import { useVocabStats } from "@/entities/vocab";
import { UserCollectionCardHeaderActions } from "./UserCollectionCardHeaderActions";
import { CollectionCard } from "../shared/CollectionCard";
import { CollectionReviewLink } from "../shared/CollectionReviewLink";
import { formatCreatedLabel } from "@/shared/lib/date";
import { useLocale, useT } from "@/shared/lib/providers";

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
    runAuthenticatedRequest,
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
