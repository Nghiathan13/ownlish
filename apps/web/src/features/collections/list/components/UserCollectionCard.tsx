import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionReviewLink } from "@/features/collections/shared/components/CollectionReviewLink";
import { CollectionCard } from "@/features/collections/shared/components/CollectionCard";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { DeleteForeverIcon } from "@/shared/ui/icons/DeleteForeverIcon";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type UserCollectionCardProps = {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  isAuthenticated: boolean;
  onDelete: (collectionId: string) => void;
  userId: string | null;
};

export function UserCollectionCard({
  collection,
  deletingCollectionId,
  isAuthenticated,
  onDelete,
  userId,
}: UserCollectionCardProps) {
  const isDeleting = deletingCollectionId === collection.id;

  return (
    <CollectionCard
      description={collection.description}
      footerAction={
        <CollectionReviewLink
          collectionId={collection.id}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      }
      headerAction={
        <button
          aria-label={
            isDeleting ? "Deleting collection" : `Delete ${collection.name}`
          }
          className={iconOnlyButtonClassName(
            "pointer-events-auto bg-transparent",
            statusColorClasses.danger.text,
            statusColorClasses.danger.backgroundHover,
          )}
          disabled={isDeleting}
          onClick={() => {
            void onDelete(collection.id);
          }}
          type="button"
        >
          <DeleteForeverIcon />
        </button>
      }
      href={getCollectionPath(collection)}
      title={collection.name}
      wordCountLabel={`${collection.itemCount} words`}
    />
  );
}
