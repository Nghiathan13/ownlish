"use client";

import { AddIcon } from "@/shared/ui/icons";
import { useT } from "@/shared/lib/providers";

type CreateCollectionCardProps = {
  onClick: () => void;
};

export function CreateCollectionCard({ onClick }: CreateCollectionCardProps) {
  const t = useT();

  return (
    <button
      className="flex min-h-45 cursor-pointer flex-col items-center justify-center gap-4 rounded-card border border-dashed border-border bg-transparent p-4 text-muted-foreground shadow-none hover:border-foreground hover:bg-hover-overlay hover:text-foreground hover:[box-shadow:none] dark:hover:border-foreground dark:hover:[box-shadow:none]"
      onClick={onClick}
      type="button"
    >
      <AddIcon className="size-8" />
      <span className="text-sm font-semibold">{t("collections.newCollection")}</span>
    </button>
  );
}
