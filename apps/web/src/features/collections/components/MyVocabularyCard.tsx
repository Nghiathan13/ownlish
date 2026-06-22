"use client";

import Link from "next/link";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { CollectionReviewLink } from "@/features/collections/components/CollectionReviewLink";
import { usePrefetchCollectionDetail } from "@/features/collections/hooks/usePrefetchCollectionDetail";
import { useVocabStats } from "@/features/home/hooks/useVocabStats";

type MyVocabularyCardProps = {
  collection: CollectionSummary | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function MyVocabularyCard({
  collection,
  isAuthenticated,
  userId,
}: MyVocabularyCardProps) {
  const collectionId = collection?.id ?? null;
  const href = collection ? getCollectionPath(collection) : null;
  const prefetchCollectionDetail = usePrefetchCollectionDetail();
  const { isLoading, stats } = useVocabStats({
    collectionId,
    isAuthenticated,
    userId,
  });
  const wordCountLabel =
    isLoading || stats == null ? "..." : `${stats.total} words`;

  if (!href || !collectionId || !collection) {
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
        onFocus={() => {
          prefetchCollectionDetail(collection);
        }}
        onMouseEnter={() => {
          prefetchCollectionDetail(collection);
        }}
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
