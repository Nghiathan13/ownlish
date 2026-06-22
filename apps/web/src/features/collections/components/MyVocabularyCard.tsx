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
        <p className="mt-5 text-sm font-semibold">{wordCountLabel}</p>
      </article>
    );
  }

  return (
    <article className="relative rounded-xl border border-border hover:bg-muted">
      <Link
        aria-label="View My Vocabulary"
        className="absolute inset-0 rounded-xl"
        href={href}
      />
      <div className="pointer-events-none relative p-4 pb-14">
        <h2 className="text-xl font-bold">My Vocabulary</h2>
        <p className="mt-5 text-sm font-semibold">{wordCountLabel}</p>
      </div>
      <div className="absolute bottom-4 right-4">
        <CollectionReviewLink
          collectionId={collectionId}
          isAuthenticated={isAuthenticated}
          userId={userId}
        />
      </div>
    </article>
  );
}
