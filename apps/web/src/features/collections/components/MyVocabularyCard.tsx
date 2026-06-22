"use client";

import Link from "next/link";
import { secondaryTextButtonClassName } from "@/shared/ui/button";

type MyVocabularyCardProps = {
  href: string | null;
  isLoadingWordCount: boolean;
  wordCount: number | null;
};

export function MyVocabularyCard({
  href,
  isLoadingWordCount,
  wordCount,
}: MyVocabularyCardProps) {
  const wordCountLabel =
    isLoadingWordCount || wordCount == null
      ? "..."
      : `${wordCount} words`;

  return (
    <article className="rounded-xl border border-border p-5 transition hover:bg-muted">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Default
          </p>
          <h2 className="text-xl font-bold">My Vocabulary</h2>
        </div>
      </div>

      <p className="mb-5 min-h-12 text-sm text-muted-foreground">
        All words in your personal vocabulary list.
      </p>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold">{wordCountLabel}</p>
        {href ? (
          <Link className={secondaryTextButtonClassName()} href={href}>
            View words
          </Link>
        ) : (
          <span className={secondaryTextButtonClassName("pointer-events-none opacity-50")}>
            View words
          </span>
        )}
      </div>
    </article>
  );
}
