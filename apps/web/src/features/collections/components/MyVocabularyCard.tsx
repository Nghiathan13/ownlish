"use client";

import Link from "next/link";

type MyVocabularyCardProps = {
  href: string | null;
  isLoadingWordCount: boolean;
  wordCount: number | null;
};

const cardClassName =
  "block rounded-xl border border-border p-4 hover:bg-muted";

export function MyVocabularyCard({
  href,
  isLoadingWordCount,
  wordCount,
}: MyVocabularyCardProps) {
  const wordCountLabel =
    isLoadingWordCount || wordCount == null
      ? "..."
      : `${wordCount} words`;

  const content = (
    <>
      <h2 className="text-xl font-bold">My Vocabulary</h2>
      <p className="mt-5 text-sm font-semibold">{wordCountLabel}</p>
    </>
  );

  if (!href) {
    return (
      <article className={`${cardClassName} pointer-events-none opacity-50`}>
        {content}
      </article>
    );
  }

  return (
    <Link className={cardClassName} href={href}>
      {content}
    </Link>
  );
}
