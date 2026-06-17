"use client";

import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
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
          {isLoadingStats ? (
            <p className="mt-2 text-sm text-muted-foreground">Loading stats...</p>
          ) : stats ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Correct {stats.practiceCorrectCount} · Wrong{" "}
              {stats.wrongQuestionCount}
            </p>
          ) : null}
        </div>
        <button
          aria-label={isClearingHistory ? "Clearing history" : "Clear history"}
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-transparent text-foreground transition-colors duration-200 hover:border-foreground disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isClearingHistory}
          onClick={onClearHistory}
          type="button"
        >
          <DeleteIcon className="size-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="gap-2 px-4 py-2" onClick={onPractice} type="button">
          <PracticeIcon className="size-4" />
          Practice
        </Button>
      </div>
    </article>
  );
}
