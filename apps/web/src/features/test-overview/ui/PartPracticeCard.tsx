"use client";

import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import {
  iconOnlyButtonClassName,
  iconTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons";
import { CloseIcon } from "@/shared/ui/icons";
import { DeleteIcon } from "@/shared/ui/icons";
import { PracticeIcon } from "@/shared/ui/icons";
import { ReplayIcon } from "@/shared/ui/icons";
import { classNames } from "@/shared/lib/classNames";
import { TopRightCountBadge } from "@/shared/ui/TopRightCountBadge";
import type {
  PartPracticePartSummary,
  ToeicPartNumber,
} from "@/entities/toeic-runtime";
import { statusColorClasses } from "@/shared/ui/theme";
import { formatMessage } from "@/shared/i18n";
import { useT } from "@/shared/lib/providers";
import { Skeleton } from "@/shared/ui/Skeleton";
import { usePartPracticeOverview } from "../model/usePartPracticeOverview";

const cardClassName =
  "flex min-w-[300px] flex-col gap-4 rounded-card border border-border bg-surface-card p-4 hover:border-primary";

const practiceButtonClassName = iconTextButtonClassName(
  "flex-1 border-foreground bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]",
);

type PartPracticeCardProps = {
  selectedPartNumber: ToeicPartNumber;
};

export function PartPracticeCard({ selectedPartNumber }: PartPracticeCardProps) {
  const t = useT();
  const overview = usePartPracticeOverview(selectedPartNumber);
  const selectedSummary = buildPartSummary(
    overview.summaries,
    overview.selectedPartNumber,
  );

  return (
    <>
      {overview.isLoading ? (
        <PartPracticeCardSkeleton />
      ) : overview.error ? (
        <div className="col-span-full space-y-3">
          <p className="text-muted-foreground">{overview.error}</p>
          <button
            className={secondaryTextButtonClassName()}
            onClick={() => void overview.reload()}
            type="button"
          >
            {t("tests.retry")}
          </button>
        </div>
      ) : (
        <div className="max-w-md">
          <PartPracticeCardBody
            isClearingHistory={
              overview.isClearing &&
              overview.clearingPartNumber === overview.selectedPartNumber
            }
            isStarting={
              overview.isStarting &&
              overview.startingPartNumber === overview.selectedPartNumber
            }
            onClearHistory={() =>
              overview.requestClearHistory(overview.selectedPartNumber)
            }
            onPractice={() =>
              void overview.startPartPractice(
                overview.selectedPartNumber,
                "practice",
              )
            }
            onReviewWrong={() =>
              void overview.startPartPractice(
                overview.selectedPartNumber,
                "review_wrong",
              )
            }
            summary={selectedSummary}
          />
        </div>
      )}

      {overview.pendingClearPartNumber != null ? (
        <ConfirmModal
          isConfirming={overview.isClearing}
          onClose={overview.cancelClearHistory}
          onConfirm={() => void overview.confirmClearHistory()}
          subtitle={t("tests.clearHistorySubtitle")}
          title={t("tests.clearHistoryTitle")}
        />
      ) : null}
    </>
  );
}

function buildPartSummary(
  summaries: PartPracticePartSummary[],
  partNumber: number,
): PartPracticePartSummary {
  return (
    summaries.find((summary) => summary.partNumber === partNumber) ?? {
      partNumber,
      total: 0,
      answered: 0,
      correct: 0,
      wrong: 0,
    }
  );
}

function PartPracticeCardSkeleton() {
  return (
    <div className="max-w-md">
      <article className={cardClassName}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="size-10 rounded-lg" />
            <Skeleton className="size-10 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </article>
    </div>
  );
}

function PartPracticeCardBody({
  summary,
  isClearingHistory = false,
  isStarting = false,
  onClearHistory,
  onPractice,
  onReviewWrong,
}: {
  summary: PartPracticePartSummary;
  isClearingHistory?: boolean;
  isStarting?: boolean;
  onClearHistory: () => void;
  onPractice: () => void;
  onReviewWrong: () => void;
}) {
  const t = useT();
  const { partNumber, total, answered, correct, wrong } = summary;

  return (
    <article className={cardClassName}>
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
              "disabled:opacity-60 disabled:hover:bg-muted-background",
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
          className={practiceButtonClassName}
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
