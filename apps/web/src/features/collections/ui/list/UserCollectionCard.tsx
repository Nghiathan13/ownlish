"use client";

import type { CollectionSummary } from "@/entities/collection";
import { getCollectionPath } from "@/entities/collection";
import { UserCollectionCardHeaderActions } from "./UserCollectionCardHeaderActions";
import { CollectionCard } from "../shared/CollectionCard";
import { CollectionReviewLink } from "../shared/CollectionReviewLink";
import { formatCreatedLabel } from "@/shared/lib/date";
import { useLocale, useT } from "@/shared/lib/providers";

type UserCollectionCardProps = {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  onDelete: (collection: CollectionSummary) => void;
  onEdit: (collection: CollectionSummary) => void;
};

export function UserCollectionCard({
  collection,
  deletingCollectionId,
  onDelete,
  onEdit,
}: UserCollectionCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const description =
    collection.description?.trim() || t("collections.noDescription");

  return (
    <CollectionCard
      createdLabel={formatCreatedLabel(collection.createdAt, locale)}
      description={description}
      footerAction={<CollectionReviewLink collectionId={collection.id} />}
      headerAction={
        <UserCollectionCardHeaderActions
          collection={collection}
          deletingCollectionId={deletingCollectionId}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      }
      href={getCollectionPath(collection)}
      title={collection.name}
      wordCountLabel={`${collection.itemCount} ${t("collections.words")}`}
    />
  );
}
