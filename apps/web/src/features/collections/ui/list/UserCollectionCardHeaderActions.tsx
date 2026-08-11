"use client";

import type { CollectionSummary } from "@/entities/collection";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { DeleteForeverIcon } from "@/shared/ui/icons";
import { EditIcon } from "@/shared/ui/icons";
import { statusColorClasses } from "@/shared/ui/theme";

type UserCollectionCardHeaderActionsProps = {
  collection: CollectionSummary;
  deletingCollectionId: string | null;
  onDelete?: (collection: CollectionSummary) => void;
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
    <div className="pointer-events-none flex shrink-0 items-center gap-2 opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
      <button
        aria-label={formatMessage(t("collections.editNamed"), {
          name: collection.name,
        })}
        className={iconOnlyButtonClassName(
          "pointer-events-auto bg-transparent text-foreground hover:bg-hover-overlay",
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
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
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void onDelete(collection);
          }}
          type="button"
        >
          <DeleteForeverIcon />
        </button>
      ) : null}
    </div>
  );
}
