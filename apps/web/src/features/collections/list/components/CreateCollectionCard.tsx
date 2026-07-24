"use client";

import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { useT } from "@/shared/providers/LocaleProvider";

type CreateCollectionCardProps = {
  onClick: () => void;
};

export function CreateCollectionCard({ onClick }: CreateCollectionCardProps) {
  const t = useT();

  return (
    <button
      className="flex min-h-45 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-5 text-muted-foreground transition hover:border-foreground hover:bg-muted hover:text-foreground"
      onClick={onClick}
      type="button"
    >
      <AddIcon className="size-8" />
      <span className="text-sm font-semibold">{t("collections.newCollection")}</span>
    </button>
  );
}
