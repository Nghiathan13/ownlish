"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
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
  const t = useT();
  const isDeleting = deletingCollectionId === collection.id;

  return (
    <div className="pointer-events-none flex shrink-0 items-center gap-2 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100">
      <button
        aria-label={formatMessage(t("collections.editNamed"), {
          name: collection.name,
        })}
        className={iconOnlyButtonClassName(
          "pointer-events-auto bg-transparent text-foreground hover:bg-muted",
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
            isDeleting
              ? t("collections.deletingCollection")
              : formatMessage(t("collections.deleteNamed"), {
                  name: collection.name,
                })
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
      ) : null}
    </div>
  );
}
