"use client";

import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
import { Button } from "@/shared/ui/Button";
import {
  practiceCorrectStatClasses,
  practiceWrongStatClasses,
} from "@/features/tests/lib/practiceGradingClasses";
import { classNames } from "@/shared/lib/classNames";
import type { ToeicTestSummary } from "@/features/tests/api/types";
import {
  getTestCorrectCount,
  getTestWrongCount,
} from "@/features/tests/lib/toeicTestProgress";

type TestCardProps = {
  test: ToeicTestSummary;
  isClearingHistory?: boolean;
  onClearHistory: () => void;
  onPractice: () => void;
};

const TOEIC_TEST_QUESTION_COUNT = 200;

export function TestCard({
  test,
  isClearingHistory = false,
  onClearHistory,
  onPractice,
}: TestCardProps) {
  const testCorrectCount = getTestCorrectCount(test);
  const testWrongCount = getTestWrongCount(test);
  const answeredQuestionCount = testCorrectCount + testWrongCount;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-4 transition hover:bg-muted">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Test {test.id}</h2>
          {answeredQuestionCount === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Not attempted yet</p>
            ) : (
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {answeredQuestionCount}/{TOEIC_TEST_QUESTION_COUNT}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckIcon className={classNames("size-4", practiceCorrectStatClasses)} />
                  <span className={practiceCorrectStatClasses}>
                    {testCorrectCount}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <CloseIcon className={classNames("size-4", practiceWrongStatClasses)} />
                  <span className={practiceWrongStatClasses}>
                    {testWrongCount}
                  </span>
                </span>
              </div>
            )}
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
      <Button className="gap-2 self-start px-4 py-2" onClick={onPractice} type="button">
        <PracticeIcon className="size-4" />
        Practice
      </Button>
    </article>
  );
}
