"use client";

import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { CloseIcon } from "@/shared/ui/icons/CloseIcon";
import { DeleteIcon } from "@/shared/ui/icons/DeleteIcon";
import { PracticeIcon } from "@/shared/ui/icons/PracticeIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";
import { iconOnlyButtonClassName, iconTextButtonClassName } from "@/shared/ui/button";
import { classNames } from "@/shared/lib/classNames";
import { TopRightCountBadge } from "@/shared/ui/TopRightCountBadge";
import type { PartPracticePartSummary } from "@/entities/toeic/api/types";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

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
  const { partNumber, total, answered, correct, wrong } = summary;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Part {partNumber}</h2>
          {answered === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No practice progress yet
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
              wrong > 0 ? `Review wrong (${wrong})` : "Review wrong (no wrong answers)"
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
            aria-label={isClearingHistory ? "Clearing history" : "Clear history"}
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
          className={iconTextButtonClassName(
            "flex-1 border-foreground bg-foreground text-background",
          )}
          disabled={isClearingHistory || isStarting}
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
