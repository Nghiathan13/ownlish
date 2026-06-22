"use client";

import Link from "next/link";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type CollectionReviewLinkProps = {
  collectionId: string;
  isAuthenticated: boolean;
  userId: string | null;
};

export function CollectionReviewLink({
  collectionId,
  isAuthenticated,
  userId,
}: CollectionReviewLinkProps) {
  const { isLoading, stats } = useVocabStats({
    collectionId,
    isAuthenticated,
    userId,
  });
  const dueCount = stats?.due;
  const label =
    isLoading || dueCount == null ? "Review (...)" : `Review (${dueCount})`;

  return (
    <Link
      className={secondaryTextButtonClassName("shrink-0")}
      href={`/review?collectionId=${collectionId}`}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      {label}
    </Link>
  );
}
