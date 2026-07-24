"use client";

import Link from "next/link";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { StartIcon } from "@/shared/ui/icons/StartIcon";

type CollectionReviewLinkProps = {
  collectionId: string;
};

export function CollectionReviewLink({
  collectionId,
}: CollectionReviewLinkProps) {
  const t = useT();

  return (
    <Link
      className={iconTextButtonClassName(
        "w-full border-border bg-transparent text-foreground hover:bg-hover-overlay",
      )}
      href={`/review?collectionId=${collectionId}`}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <StartIcon />
      {t("collections.review")}
    </Link>
  );
}
