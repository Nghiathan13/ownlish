"use client";

import { useState } from "react";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { ReviewCard, ReviewStateBlock } from "@/features/review/components";
import { useReviewQueue } from "@/features/review/hooks/useReviewQueue";
import type { ReviewGrade } from "@/features/review/lib/reviewSchedule";
import { Panel } from "@/shared/ui/Panel";
import { PageShell } from "@/shared/ui/PageShell";

export default function ReviewPage() {
  return (
    <RequireAuth>
      <ReviewPageContent />
    </RequireAuth>
  );
}

function ReviewPageContent() {
  const { accessToken, clearSession, user } = useAuthSession();
  const [showMeaning, setShowMeaning] = useState(false);
  const {
    currentWord,
    error,
    gradeCurrentWord,
    isEmpty,
    isLoading,
    isSubmittingGrade,
    remainingWords,
    reload,
    totalWords,
  } = useReviewQueue({
    accessToken,
    clearSession,
    isAuthenticated: Boolean(accessToken),
    userId: user?.id ?? null,
  });

  async function handleGrade(grade: ReviewGrade) {
    await gradeCurrentWord(grade);
    setShowMeaning(false);
  }

  return (
    <PageShell>
      <Panel>
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Review
          </p>
          <h1 className="mb-3 text-3xl font-bold leading-tight">
            Review due words
          </h1>
          <p className="text-muted-foreground">
            {totalWords
              ? `${remainingWords}/${totalWords} words remaining`
              : "Practice words that are ready today."}
          </p>
        </div>

        {isLoading || error || isEmpty || !currentWord ? (
          <ReviewStateBlock
            error={error}
            isEmpty={isEmpty}
            isLoading={isLoading}
            onRetry={reload}
          />
        ) : (
          <ReviewCard
            isSubmitting={isSubmittingGrade}
            onGrade={handleGrade}
            onToggleMeaning={() => setShowMeaning((current) => !current)}
            showMeaning={showMeaning}
            word={currentWord}
          />
        )}

      </Panel>
    </PageShell>
  );
}
