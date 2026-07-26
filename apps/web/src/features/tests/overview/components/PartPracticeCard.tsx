"use client";

import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";
import { TopRightCountBadge } from "@/shared/ui/TopRightCountBadge";
import type { PartPracticePartSummary } from "@/entities/toeic-runtime/model/presentation";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import {
  testOverviewCardClassName,
  testOverviewPracticeButtonClassName,
} from "@/features/tests/overview/lib/testOverviewCard";
import { formatMessage } from "@/shared/i18n/messages";
import { useT } from "@/shared/providers/LocaleProvider";

type PartPracticeCardProps = {
  summary: PartPracticePartSummary;
  isClearingHistory?: boolean;
  isStarting?: boolean;
  onClearHistory: () => void;
  onPractice: () => void;
  onReviewWrong: () => void;
};

export function PartPracticeCard({
  summary,
  isClearingHistory = false,
  isStarting = false,
  onClearHistory,
  onPractice,
  onReviewWrong,
}: PartPracticeCardProps) {
  const t = useT();
  const { partNumber, total, answered, correct, wrong } = summary;

  return (
    <article className={testOverviewCardClassName}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {formatMessage(t("tests.partNumber"), { number: partNumber })}
          </h2>
          {answered === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("tests.noProgressYet")}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {answered}/{total}
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckIcon className={classNames("size-4", statusColorClasses.success.text)} />
                <span className={statusColorClasses.success.text}>{correct}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <CloseIcon className={classNames("size-4", statusColorClasses.danger.text)} />
                <span className={statusColorClasses.danger.text}>{wrong}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={
              wrong > 0
                ? formatMessage(t("tests.reviewWrongCount"), { count: wrong })
                : t("tests.reviewWrongNone")
            }
            className={iconOnlyButtonClassName(
              "relative bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
              "disabled:opacity-60 disabled:hover:bg-muted",
            )}
            disabled={isClearingHistory || isStarting || wrong === 0}
            onClick={onReviewWrong}
            type="button"
          >
            <ReplayIcon />
            {wrong > 0 ? <TopRightCountBadge count={wrong} /> : null}
          </button>
          <button
            aria-label={
              isClearingHistory
                ? t("tests.clearingHistory")
                : t("tests.clearHistory")
            }
            className={iconOnlyButtonClassName(
              "bg-transparent",
              statusColorClasses.danger.text,
              statusColorClasses.danger.backgroundHover,
            )}
            disabled={isClearingHistory || isStarting}
            onClick={onClearHistory}
            type="button"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
      <div className="flex w-full gap-2">
        <button
          className={testOverviewPracticeButtonClassName}
          disabled={isClearingHistory || isStarting}
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
