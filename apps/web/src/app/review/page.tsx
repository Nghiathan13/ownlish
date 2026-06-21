"use client";

import { useCallback, useEffect, useState } from "react";
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
  const { status, user } = useAuthSession();
  const isAuthenticated = status === "authenticated";
  const [showMeaning, setShowMeaning] = useState(false);
  const {
    currentWord,
    error,
    gradeCurrentWord,
    isEmpty,
    isLoading,
    isSubmittingGrade,
    reload,
  } = useReviewQueue({
    isAuthenticated,
    userId: user?.id ?? null,
  });

  const handleGrade = useCallback(async (grade: ReviewGrade) => {
    if (!showMeaning) {
      return;
    }

    await gradeCurrentWord(grade);
    setShowMeaning(false);
  }, [gradeCurrentWord, showMeaning]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!currentWord || isSubmittingGrade) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setShowMeaning((current) => !current);
        return;
      }

      if (!showMeaning) {
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        void handleGrade("forgot");
        return;
      }

      if (event.key === "2") {
        event.preventDefault();
        void handleGrade("remember");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentWord, handleGrade, isSubmittingGrade, showMeaning]);

  return (
    <PageShell>
      <Panel>
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
