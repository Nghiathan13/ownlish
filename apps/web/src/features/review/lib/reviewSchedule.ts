import type { ReviewRating } from "@/entities/vocab/api/vocab";

const EASY_DAYS_BY_LEVEL = [2, 4, 7, 15, 30, 60, 60] as const;

function getEasyHours(level: number) {
  return EASY_DAYS_BY_LEVEL[Math.min(level, EASY_DAYS_BY_LEVEL.length - 1)] * 24;
}

export function getReviewIntervalLabel(level: number, rating: ReviewRating) {
  if (rating === "EASY" && level >= 6) return "∞";

  const hours =
    rating === "FORGET"
      ? getEasyHours(Math.max(0, level - 2)) / 27
      : rating === "HARD"
        ? getEasyHours(level) / 9
        : rating === "GOOD"
          ? getEasyHours(level) / 3
          : getEasyHours(level);

  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;

  return `${Math.round(hours / 24)}d`;
}
