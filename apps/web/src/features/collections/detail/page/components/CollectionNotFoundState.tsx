"use client";

import { useT } from "@/shared/providers/LocaleProvider";

export function CollectionNotFoundState() {
  const t = useT();

  return (
    <div className="mx-16 rounded-xl border border-border p-6">
      <h1 className="mb-2 text-xl font-semibold">
        {t("collections.notFoundTitle")}
      </h1>
      <p className="text-muted-foreground">
        {t("collections.notFoundDescription")}
      </p>
    </div>
  );
}
