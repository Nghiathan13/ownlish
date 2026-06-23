import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionReviewLink } from "@/features/collections/shared/components/CollectionReviewLink";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { UserCollectionCardHeaderActions } from "@/features/collections/list/components/UserCollectionCardHeaderActions";
import { formatCreatedLabel } from "@/shared/lib/date";

type UserCollectionCardProps = {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  onDelete: (collectionId: string) => void;
  onEdit: (collection: CollectionSummary) => void;
  userId: string | null;
};

export function UserCollectionCard({
  collection,
  deletingCollectionId,
  isAuthenticated,
  onDelete,
  onEdit,
  userId,
}: UserCollectionCardProps) {
  const description = collection.description?.trim() || "No description.";

  return (
    <CollectionCard
      createdLabel={formatCreatedLabel(collection.createdAt)}
      description={description}
      footerAction={
        <CollectionReviewLink
          collectionId={collection.id}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      }
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
      wordCountLabel={`${collection.itemCount} words`}
    />
  );
}
