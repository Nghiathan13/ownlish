import type {
  UpdateVocabReviewInput,
  VocabWordDefinition,
} from "@/entities/vocab/api/vocab";

const MAX_REVIEW_LEVEL = 7;

export type ReviewGrade = "forgot" | "remember";

type ReviewProgress = Pick<VocabWordDefinition, "level" | "wrongCount">;

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export function getDaysForLevel(level: number) {
  switch (level) {
    case 0:
      return 2;
    case 1:
      return 4;
    case 2:
      return 7;
    case 3:
      return 15;
    case 4:
      return 30;
    case 5:
      return 60;
    default:
      return 60;
  }
}

export function buildReviewUpdate(
  definition: ReviewProgress,
  grade: ReviewGrade,
  reviewedAt = new Date(),
): UpdateVocabReviewInput {
  if (grade === "forgot") {
    const nextLevel = Math.max(0, definition.level - 2);
    const daysToAdd = nextLevel === 0 ? 1 : getDaysForLevel(nextLevel - 1);

    return {
      level: nextLevel,
      wrongCount: definition.wrongCount + 1,
      lastReview: reviewedAt.toISOString(),
      nextReview: addDays(reviewedAt, daysToAdd).toISOString(),
    };
  }

  const nextLevel = Math.min(MAX_REVIEW_LEVEL, definition.level + 1);

  return {
    level: nextLevel,
    wrongCount: 0,
    lastReview: reviewedAt.toISOString(),
    nextReview:
      nextLevel === MAX_REVIEW_LEVEL
        ? null
        : addDays(reviewedAt, getDaysForLevel(definition.level)).toISOString(),
  };
}
