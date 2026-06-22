"use client";

import Link from "next/link";
import { CollectionReviewLink } from "@/features/collections/components/CollectionReviewLink";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";

type MyVocabularyCardProps = {
  collectionId: string | null;
  href: string | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function MyVocabularyCard({
  collectionId,
  href,
  isAuthenticated,
  userId,
}: MyVocabularyCardProps) {
  const { isLoading, stats } = useVocabStats({
    collectionId,
    isAuthenticated,
    userId,
  });
  const wordCountLabel =
    isLoading || stats == null ? "..." : `${stats.total} words`;

  if (!href || !collectionId) {
    return (
      <article className="rounded-xl border border-border p-4 opacity-50">
        <h2 className="text-xl font-bold">My Vocabulary</h2>
        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">{wordCountLabel}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-border hover:bg-muted">
      <Link className="block p-4 pb-0" href={href}>
        <h2 className="text-xl font-bold">My Vocabulary</h2>
      </Link>
      <div className="flex items-center justify-between gap-4 p-4">
        <Link className="text-sm font-semibold" href={href}>
          {wordCountLabel}
        </Link>
        <CollectionReviewLink
          collectionId={collectionId}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      </div>
    </article>
  );
}
