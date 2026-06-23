"use client";

import Link from "next/link";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { QuizIcon } from "@/shared/ui/icons/QuizIcon";

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
  const isDisabled = !isLoading && dueCount === 0;
  const label =
    isLoading || dueCount == null
      ? "Review (...)"
      : dueCount === 0
        ? "Review"
        : `Review (${dueCount})`;
  const enabledClassName = iconTextButtonClassName(
    "pointer-events-auto relative z-20 shrink-0 border-foreground bg-foreground text-background",
  );
  const disabledClassName = iconTextButtonClassName(
    "pointer-events-auto relative z-20 shrink-0 border-border bg-muted text-muted-foreground",
  );

  if (isDisabled) {
    return (
      <button className={disabledClassName} disabled type="button">
        <QuizIcon />
        {label}
      </button>
    );
  }

  return (
    <Link
      className={enabledClassName}
      href={`/review?collectionId=${collectionId}`}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <QuizIcon />
      {label}
    </Link>
  );
}
