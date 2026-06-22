import Link from "next/link";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionReviewLink } from "@/features/collections/shared/components/CollectionReviewLink";
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
  const collectionHref = getCollectionPath(collection);

  return (
    <article className="relative rounded-xl border border-border hover:bg-muted">
      <Link
        aria-label={`View ${collection.name}`}
        className="absolute inset-0 rounded-xl"
        href={collectionHref}
      />
      <button
        aria-label={
          isDeleting ? "Deleting collection" : `Delete ${collection.name}`
        }
        className={iconOnlyButtonClassName(
          "absolute right-3 top-3 z-20 bg-transparent",
          statusColorClasses.danger.text,
          statusColorClasses.danger.backgroundHover,
        )}
        disabled={isDeleting}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void onDelete(collection.id);
        }}
        type="button"
      >
        <DeleteForeverIcon />
      </button>
      <div className="pointer-events-none relative p-4 pb-14">
        <h2 className="pr-10 text-xl font-bold">{collection.name}</h2>
        <p className="mt-5 text-sm font-semibold">{collection.itemCount} words</p>
      </div>
      <div className="absolute bottom-4 right-4">
        <CollectionReviewLink
          collectionId={collection.id}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      </div>
    </article>
  );
}
