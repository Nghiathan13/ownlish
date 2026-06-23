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
  const isDisabled = !isLoading && dueCount === 0;
  const label = isLoading ? "Review (...)" : "Review";
  const reviewLabel =
    !isLoading && dueCount > 0 ? `Review (${dueCount})` : label;
  const enabledClassName = iconTextButtonClassName(
    "pointer-events-auto relative z-20 shrink-0 border-foreground bg-foreground text-background",
  );
  const disabledClassName = iconTextButtonClassName(
    "pointer-events-auto relative z-20 shrink-0 border-border bg-muted text-muted-foreground",
  );
  const badge =
    !isLoading && dueCount > 0 ? <TopRightCountBadge count={dueCount} /> : null;

  if (isDisabled) {
    return (
      <button
        aria-label="Review"
        className={disabledClassName}
        disabled
        type="button"
      >
        <QuizIcon />
        {label}
      </button>
    );
  }

  return (
    <Link
      aria-label={reviewLabel}
      className={enabledClassName}
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
