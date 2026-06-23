"use client";

import Link from "next/link";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { QuizIcon } from "@/shared/ui/icons/QuizIcon";
import { TopRightCountBadge } from "@/shared/ui/TopRightCountBadge";

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
  const dueCount = stats?.due ?? 0;

  if (!isLoading && dueCount === 0) {
    return null;
  }

  const label = isLoading ? "Review (...)" : "Review";
  const reviewLabel =
    !isLoading && dueCount > 0 ? `Review (${dueCount})` : label;
  const className = iconTextButtonClassName(
    "pointer-events-auto relative z-20 shrink-0 border-foreground bg-foreground text-background",
  );
  const badge =
    !isLoading && dueCount > 0 ? <TopRightCountBadge count={dueCount} /> : null;

  return (
    <Link
      aria-label={reviewLabel}
      className={className}
      href={`/review?collectionId=${collectionId}`}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <QuizIcon />
      {label}
      {badge}
    </Link>
  );
}
