"use client";

import { Button } from "@/shared/ui/Button";
import type {
  PracticeStats,
  ToeicTestSummary,
} from "@/features/tests/api/types";

type TestCardProps = {
  test: ToeicTestSummary;
  stats: PracticeStats | null;
  isLoadingStats?: boolean;
  isClearingHistory?: boolean;
  onClearHistory: () => void;
  onPractice: () => void;
};

export function TestCard({
  test,
  stats,
  isLoadingStats = false,
  isClearingHistory = false,
  onClearHistory,
  onPractice,
}: TestCardProps) {
  return (
    <article className="rounded-xl border border-border p-5 transition hover:bg-muted">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{test.label}</h2>
          <p className="text-sm text-muted-foreground">TOEIC {test.year}</p>
          {isLoadingStats ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading stats...</p>
          ) : stats ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Correct {stats.practiceCorrectCount} · Wrong{" "}
              {stats.wrongQuestionCount}
            </p>
          ) : null}
        </div>
        <Button
          disabled={isClearingHistory}
          onClick={onClearHistory}
          type="button"
          variant="secondary"
        >
          {isClearingHistory ? "Clearing..." : "Clear history"}
        </Button>
      </div>
      <Button onClick={onPractice} type="button">
        Practice
      </Button>
    </article>
  );
}
