export const REVIEW_RATINGS = ['FORGET', 'HARD', 'GOOD', 'EASY'] as const;

export type ReviewRating = (typeof REVIEW_RATINGS)[number];

type ReviewProgress = {
  level: number;
  wrongCount: number;
};

export type ScheduledReviewProgress = ReviewProgress & {
  lastReviewAt: Date;
  nextReviewAt: Date | null;
};

const MAX_REVIEW_LEVEL = 7;
const EASY_DAYS_BY_LEVEL = [2, 4, 7, 15, 30, 60, 60] as const;

function getEasyDelayMilliseconds(level: number) {
  const days =
    EASY_DAYS_BY_LEVEL[Math.min(level, EASY_DAYS_BY_LEVEL.length - 1)];

  return days * 24 * 60 * 60 * 1000;
}

export function scheduleReview(
  progress: ReviewProgress,
  rating: ReviewRating,
  reviewedAt = new Date(),
): ScheduledReviewProgress {
  if (rating === 'FORGET') {
    const level = Math.max(0, progress.level - 2);

    return {
      level,
      wrongCount: progress.wrongCount + 1,
      lastReviewAt: reviewedAt,
      nextReviewAt: new Date(
        reviewedAt.getTime() + getEasyDelayMilliseconds(level) / 27,
      ),
    };
  }

  if (rating === 'HARD') {
    return {
      ...progress,
      lastReviewAt: reviewedAt,
      nextReviewAt: new Date(
        reviewedAt.getTime() + getEasyDelayMilliseconds(progress.level) / 9,
      ),
    };
  }

  if (rating === 'GOOD') {
    return {
      ...progress,
      lastReviewAt: reviewedAt,
      nextReviewAt: new Date(
        reviewedAt.getTime() + getEasyDelayMilliseconds(progress.level) / 3,
      ),
    };
  }

  const level = Math.min(MAX_REVIEW_LEVEL, progress.level + 1);

  return {
    ...progress,
    level,
    lastReviewAt: reviewedAt,
    nextReviewAt:
      level === MAX_REVIEW_LEVEL
        ? null
        : new Date(
            reviewedAt.getTime() + getEasyDelayMilliseconds(progress.level),
          ),
  };
}
