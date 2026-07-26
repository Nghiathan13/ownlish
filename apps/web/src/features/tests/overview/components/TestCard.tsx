"use client";

import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { HistoryIcon } from "@/shared/ui/icons/HistoryIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";
import { StartIcon } from "@/shared/ui/icons/StartIcon";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";
import { TopRightCountBadge } from "@/shared/ui/TopRightCountBadge";
import {
  type CatalogTestSummary,
} from "@/features/tests/shared/model/catalogTestSummary";
import {
  getTestCorrectCount,
  getTestWrongCount,
} from "@/features/tests/shared/lib/toeicTestProgress";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import {
  testOverviewCardClassName,
  testOverviewMockButtonClassName,
  testOverviewPracticeButtonClassName,
} from "@/features/tests/overview/lib/testOverviewCard";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconButtonGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

type TestCardProps = {
  test: CatalogTestSummary;
  isClearingHistory?: boolean;
  onClearHistory: () => void;
  onMockHistory: () => void;
  onMock: () => void;
  onPractice: () => void;
  onReviewWrong: () => void;
};

export function TestCard({
  test,
  isClearingHistory = false,
  onClearHistory,
  onMockHistory,
  onMock,
  onPractice,
  onReviewWrong,
}: TestCardProps) {
  const t = useT();
  const testCorrectCount = getTestCorrectCount(test);
  const testWrongCount = getTestWrongCount(test);
  const answeredQuestionCount = testCorrectCount + testWrongCount;

  return (
    <article className={testOverviewCardClassName}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {formatMessage(t("tests.testNumber"), {
            number: test.catalog.testNumber,
          })}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={t("tests.mockHistory")}
            className={iconOnlyButtonClassName(
              "relative bg-transparent text-foreground hover:bg-hover-overlay",
              iconButtonGroupClassName,
            )}
            onClick={onMockHistory}
            type="button"
          >
            <HistoryIcon />
            <Tooltip group="icon-button" placement="bottom">
              {t("tests.mockHistory")}
            </Tooltip>
          </button>
          <button
            aria-label={
              testWrongCount > 0
                ? formatMessage(t("tests.reviewWrongCount"), {
                    count: testWrongCount,
                  })
                : t("tests.reviewWrongAllParts")
            }
            className={iconOnlyButtonClassName(
              "relative bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
              "disabled:opacity-60 disabled:hover:bg-muted",
              iconButtonGroupClassName,
            )}
            disabled={isClearingHistory || testWrongCount === 0}
            onClick={onReviewWrong}
            type="button"
          >
            <ReplayIcon />
            {testWrongCount > 0 ? (
              <TopRightCountBadge count={testWrongCount} />
            ) : null}
            <Tooltip group="icon-button" placement="bottom">
              {testWrongCount > 0
                ? formatMessage(t("tests.reviewWrongCount"), {
                    count: testWrongCount,
                  })
                : t("tests.reviewWrongAllParts")}
            </Tooltip>
          </button>
          <button
            aria-label={
              isClearingHistory
                ? t("tests.clearingHistory")
                : t("tests.clearHistory")
            }
            className={iconOnlyButtonClassName(
              "relative bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
              iconButtonGroupClassName,
            )}
            disabled={isClearingHistory}
            onClick={onClearHistory}
            type="button"
          >
            <DeleteIcon />
            <Tooltip group="icon-button" placement="bottom">
              {isClearingHistory
                ? t("tests.clearingHistory")
                : t("tests.clearHistory")}
            </Tooltip>
          </button>
        </div>
      </div>
      {answeredQuestionCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("tests.noProgressYet")}
        </p>
      ) : (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {answeredQuestionCount}/{test.totalQuestions}
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
      <div className="flex min-w-0 w-full gap-2">
        <button
          className={testOverviewMockButtonClassName}
          onClick={onMock}
          type="button"
        >
          <StartIcon />
          {t("tests.mock")}
        </button>
        <button
          className={testOverviewPracticeButtonClassName}
          onClick={onPractice}
          type="button"
        >
          <PracticeIcon />
          {t("tests.practice")}
        </button>
      </div>
    </article>
  );
}
