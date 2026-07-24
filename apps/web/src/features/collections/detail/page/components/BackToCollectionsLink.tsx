"use client";

import Link from "next/link";
import { getCollectionsListPath } from "@/entities/collection/lib/collectionDisplay";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";

export const collectionsBackButtonClassName = iconTextButtonClassName(
  "w-fit shrink-0 border border-surface bg-surface shadow-card hover:border-[var(--hover-on-surface)] hover:bg-[var(--hover-on-surface)] dark:border-border dark:hover:border-border dark:hover:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
);

export function BackToCollectionsLink() {
  const t = useT();

  return (
    <Link
      aria-label={t("collections.backToMyCollections")}
      className={collectionsBackButtonClassName}
      href={getCollectionsListPath("user")}
    >
      {t("collections.back")}
    </Link>
  );
}
