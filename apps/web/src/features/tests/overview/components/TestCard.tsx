"use client";

import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";
import { Button } from "@/shared/ui/Button";
import { classNames } from "@/shared/lib/classNames";
import type { ToeicTestSummary } from "@/features/tests/shared/api/types";
import {
  getTestCorrectCount,
  getTestWrongCount,
} from "@/features/tests/overview/lib/toeicTestProgress";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type TestCardProps = {
  test: ToeicTestSummary;
  isClearingHistory?: boolean;
  onClearHistory: () => void;
  onPractice: () => void;
  onReviewWrong: () => void;
};

const TOEIC_TEST_QUESTION_COUNT = 200;

export function TestCard({
  test,
  isClearingHistory = false,
  onClearHistory,
  onPractice,
  onReviewWrong,
}: TestCardProps) {
  const testCorrectCount = getTestCorrectCount(test);
  const testWrongCount = getTestWrongCount(test);
  const answeredQuestionCount = testCorrectCount + testWrongCount;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Test {test.id}</h2>
          {answeredQuestionCount === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No practice progress yet</p>
            ) : (
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {answeredQuestionCount}/{TOEIC_TEST_QUESTION_COUNT}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckIcon className={classNames("size-4", statusColorClasses.success.text)} />
                  <span className={statusColorClasses.success.text}>
                    {testCorrectCount}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <CloseIcon className={classNames("size-4", statusColorClasses.danger.text)} />
                  <span className={statusColorClasses.danger.text}>
                    {testWrongCount}
                  </span>
                </span>
              </div>
            )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={
              testWrongCount > 0
                ? `Review wrong (${testWrongCount})`
                : "Review wrong (all parts)"
            }
            className={classNames(
              "relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
              "disabled:cursor-not-allowed disabled:text-foreground disabled:opacity-60 disabled:hover:bg-muted",
            )}
            disabled={isClearingHistory || testWrongCount === 0}
            onClick={onReviewWrong}
            type="button"
          >
            <ReplayIcon className="size-4" />
            {testWrongCount > 0 ? (
              <span
                aria-hidden
                className={classNames(
                  "pointer-events-none absolute -right-0.5 -top-0.5",
                  "inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 py-px",
                  "text-[10px] font-semibold leading-none tabular-nums text-background",
                  "bg-red-700 dark:bg-red-400",
                )}
              >
                {testWrongCount}
              </span>
            ) : null}
          </button>
          <button
            aria-label={isClearingHistory ? "Clearing history" : "Clear history"}
            className={classNames(
              "inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            disabled={isClearingHistory}
            onClick={onClearHistory}
            type="button"
          >
            <DeleteIcon className="size-4" />
          </button>
        </div>
      </div>
      <Button className="gap-2 self-start px-4 py-2" onClick={onPractice} type="button">
        <PracticeIcon className="size-5" />
        Practice
      </Button>
    </article>
  );
}
