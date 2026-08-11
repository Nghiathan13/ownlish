"use client";

import { collectionListCardClassName } from "../../lib/collectionListCard";
import { AddIcon } from "@/shared/ui/icons";
import { useT } from "@/shared/lib/providers";
import { classNames } from "@/shared/lib/classNames";

type CreateCollectionCardProps = {
  onClick: () => void;
};

export function CreateCollectionCard({ onClick }: CreateCollectionCardProps) {
  const t = useT();

  return (
    <button
      className={classNames(
        collectionListCardClassName,
        "min-h-45 cursor-pointer items-center justify-center border border-dashed border-border bg-transparent text-muted-foreground shadow-none hover:border-foreground hover:bg-hover-overlay hover:text-foreground hover:[box-shadow:none] dark:hover:border-foreground dark:hover:[box-shadow:none]",
      )}
      onClick={onClick}
      type="button"
    >
      <AddIcon className="size-8" />
      <span className="text-sm font-semibold">{t("collections.newCollection")}</span>
    </button>
  );
}
