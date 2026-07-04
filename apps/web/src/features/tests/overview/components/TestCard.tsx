"use client";

import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";
import { StartIcon } from "@/shared/ui/icons/StartIcon";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";
import { TopRightCountBadge } from "@/shared/ui/TopRightCountBadge";
import type { ToeicTestSummary } from "@/features/tests/shared/api/types";
import {
  getTestCorrectCount,
  getTestWrongCount,
} from "@/features/tests/shared/lib/toeicTestProgress";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import { testOverviewCardClassName, testOverviewMockButtonClassName, testOverviewPracticeButtonClassName } from "@/features/tests/overview/lib/testOverviewCard";

type TestCardProps = {
  test: ToeicTestSummary;
  isClearingHistory?: boolean;
  onClearHistory: () => void;
  onMock: () => void;
  onPractice: () => void;
  onReviewWrong: () => void;
};

const TOEIC_TEST_QUESTION_COUNT = 200;

export function TestCard({
  test,
  isClearingHistory = false,
  onClearHistory,
  onMock,
  onPractice,
  onReviewWrong,
}: TestCardProps) {
  const testCorrectCount = getTestCorrectCount(test);
  const testWrongCount = getTestWrongCount(test);
  const answeredQuestionCount = testCorrectCount + testWrongCount;

  return (
    <article className={testOverviewCardClassName}>
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
            className={iconOnlyButtonClassName(
              "relative bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
              "disabled:opacity-60 disabled:hover:bg-muted",
            )}
            disabled={isClearingHistory || testWrongCount === 0}
            onClick={onReviewWrong}
            type="button"
          >
            <ReplayIcon />
            {testWrongCount > 0 ? (
              <TopRightCountBadge count={testWrongCount} />
            ) : null}
          </button>
          <button
            aria-label={isClearingHistory ? "Clearing history" : "Clear history"}
            className={iconOnlyButtonClassName(
              "bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
            )}
            disabled={isClearingHistory}
            onClick={onClearHistory}
            type="button"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
      <div className="flex w-full gap-2">
        <button
          className={testOverviewMockButtonClassName}
          onClick={onMock}
          type="button"
        >
          <StartIcon />
          Mock
        </button>
        <button
          className={testOverviewPracticeButtonClassName}
          onClick={onPractice}
          type="button"
        >
          <PracticeIcon />
          Practice
        </button>
      </div>
    </article>
  );
}
