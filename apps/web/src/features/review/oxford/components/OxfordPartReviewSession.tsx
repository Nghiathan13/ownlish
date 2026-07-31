"use client";

import Link from "next/link";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { LEARNING_ACTIVITY_TYPES } from "@/entities/learning-activity";
import { useLearningActivityTracker } from "@/features/learning-activity/model/useLearningActivityTracker";
import { getOxfordPath, type OxfordBand } from "@/features/collections/oxford/lib/oxfordNavigation";
import { ReviewStudySession } from "@/features/review/components";
import { useReviewMode } from "@/features/review/hooks/useReviewMode";
import { toOxfordReviewStudyWord } from "@/features/review/model/reviewStudyWord";
import { primaryTextButtonClassName, secondaryTextButtonClassName } from "@/shared/ui/button";
import { useOxfordPartReviewQueue } from "../model/useOxfordPartReviewQueue";

type OxfordPartReviewSessionProps = {
  band: OxfordBand;
  part: number;
};

export function OxfordPartReviewSession({ band, part }: OxfordPartReviewSessionProps) {
  const { status, user } = useAuthSession();
  const { mode } = useReviewMode();
  const review = useOxfordPartReviewQueue({
    band,
    part,
    isAuthenticated: isAuthenticatedStatus(status),
    userId: user?.id ?? null,
  });
  useLearningActivityTracker({
    activityType: LEARNING_ACTIVITY_TYPES.VOCABULARY_REVIEW,
    enabled:
      isAuthenticatedStatus(status) &&
      Boolean(user) &&
      !review.isLoading &&
      !review.isEmpty &&
      Boolean(review.currentWord),
  });

  if (review.isLoading) {
    return <ReviewLoading />;
  }

  if (review.error && !review.currentWord) {
    return <ReviewError error={review.error} onRetry={review.reload} />;
  }

  if (review.currentWord) {
    return (
      <ReviewStudySession
        error={review.error}
        isSubmitting={review.isSubmitting}
        key={`${mode}:${review.currentWord.id}`}
        level={review.currentWord.progress?.level ?? 0}
        mode={mode}
        onAgain={() => review.gradeCurrentWord("FORGET")}
        onEasy={() => review.gradeCurrentWord("EASY")}
        onGood={() => review.gradeCurrentWord("GOOD")}
        onHard={() => review.gradeCurrentWord("HARD")}
        onMaster={() => review.gradeCurrentWord("MASTER")}
        reviewedCount={review.reviewedCount}
        totalWords={review.totalWords}
        word={toOxfordReviewStudyWord(review.currentWord)}
      />
    );
  }

  if (review.isEmpty) {
    return <ReviewComplete band={band} part={part} />;
  }

  return null;
}

function ReviewLoading() {
  return <div className="h-[480px] animate-pulse rounded-lg border border-border bg-surface dark:bg-[#000000]" />;
}

function ReviewError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="grid h-[480px] place-items-center rounded-lg border border-border bg-surface p-6 text-center dark:bg-[#000000]">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-danger">Review could not load</p>
        <p className="mt-3 leading-7 text-muted-foreground">{error}</p>
        <button
          className={secondaryTextButtonClassName("mt-6 hover:bg-hover-overlay")}
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function ReviewComplete({ band, part }: OxfordPartReviewSessionProps) {
  return (
    <div className="grid h-[480px] place-items-center rounded-lg border border-border bg-surface p-6 text-center dark:bg-[#000000]">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-muted-foreground">Part complete</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Nice work.</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          You have reviewed all words in this part.
        </p>
        <Link
          className={primaryTextButtonClassName("mt-6")}
          href={getOxfordPath(band, part)}
        >
          Back to collection
        </Link>
      </div>
    </div>
  );
}
