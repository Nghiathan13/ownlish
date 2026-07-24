"use client";

import Link from "next/link";
import { getCollectionsListPath } from "@/entities/collection/lib/collectionDisplay";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";

export function BackToCollectionsLink() {
  const t = useT();

  return (
    <Link
      aria-label={t("collections.backToMyCollections")}
      className={iconTextButtonClassName(
        "w-fit shrink-0",
        "border-foreground bg-foreground text-background",
      )}
      href={getCollectionsListPath("user")}
    >
      <ArrowBackIcon />
      {t("collections.back")}
    </Link>
  );
}
