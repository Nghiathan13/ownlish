import type { CollectionSummary } from "@/entities/collection/api/collections";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { DeleteForeverIcon } from "@/shared/ui/icons/DeleteForeverIcon";
import { EditIcon } from "@/shared/ui/icons/EditIcon";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type UserCollectionCardHeaderActionsProps = {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  onDelete?: (collectionId: string) => void;
  onEdit: (collection: CollectionSummary) => void;
};

export function UserCollectionCardHeaderActions({
  collection,
  deletingCollectionId,
  onDelete,
  onEdit,
}: UserCollectionCardHeaderActionsProps) {
  const isDeleting = deletingCollectionId === collection.id;

  return (
    <div className="pointer-events-auto flex shrink-0 items-center gap-2">
      <button
        aria-label={`Edit ${collection.name}`}
        className={iconOnlyButtonClassName(
          "bg-transparent text-muted-foreground hover:text-foreground",
        )}
        onClick={() => {
          onEdit(collection);
        }}
        type="button"
      >
        <EditIcon />
      </button>
      {onDelete ? (
        <button
          aria-label={
            isDeleting ? "Deleting collection" : `Delete ${collection.name}`
          }
          className={iconOnlyButtonClassName(
            "bg-transparent",
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
      ) : null}
    </div>
  );
}
