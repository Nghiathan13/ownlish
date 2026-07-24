"use client";

import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type CollectionCategoryEmptyStateProps = {
  categoryLabel: string;
};

export function CollectionCategoryEmptyState({
  categoryLabel,
}: CollectionCategoryEmptyStateProps) {
  const t = useT();

  return (
    <div className="mx-16 rounded-xl border border-border p-6">
      <h2 className="mb-2 text-xl font-semibold">
        {formatMessage(t("collections.emptyTitle"), { category: categoryLabel })}
      </h2>
      <p className="text-muted-foreground">{t("collections.emptyDescription")}</p>
    </div>
  );
}
