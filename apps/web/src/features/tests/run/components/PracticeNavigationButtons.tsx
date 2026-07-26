"use client";

import { useState } from "react";
import { PracticeQuestionGridPanel } from "@/features/tests/run/components/PracticeQuestionGridPanel";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
import type { ReactNode } from "react";
import { formatMessage } from "@/shared/i18n/messages";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { GridViewIcon } from "@/shared/ui/icons/GridViewIcon";
import { useT } from "@/shared/providers/LocaleProvider";

type PracticeNavigationButtonsProps = {
  nextAriaLabel?: string;
  nextDisabled?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  previousDisabled?: boolean;
  questionGridSections?: QuestionGridSection[];
  onQuestionGridSelect?: (questionId: number) => void;
  isQuestionGridOpen?: boolean;
  leftSlot?: ReactNode;
  onQuestionGridOpenChange?: (open: boolean) => void;
  currentQuestionNumber?: number;
  totalQuestions?: number;
};

export function PracticeNavigationButtons({
  nextAriaLabel,
  nextDisabled = false,
  onNext,
  onPrevious,
  previousDisabled = false,
  questionGridSections,
  onQuestionGridSelect,
  isQuestionGridOpen,
  leftSlot,
  onQuestionGridOpenChange,
  currentQuestionNumber,
  totalQuestions,
}: PracticeNavigationButtonsProps) {
  const t = useT();
  const resolvedNextAriaLabel = nextAriaLabel ?? t("tests.next");
  const [internalGridOpen, setInternalGridOpen] = useState(false);
  const isGridOpen = isQuestionGridOpen ?? internalGridOpen;
  const setIsGridOpen = onQuestionGridOpenChange ?? setInternalGridOpen;
  const showQuestionGrid =
    questionGridSections != null &&
    questionGridSections.some((section) => section.cells.length > 0) &&
    onQuestionGridSelect != null;
  const showQuestionPosition =
    currentQuestionNumber != null &&
    totalQuestions != null &&
    totalQuestions > 0;

  return (
    <>
      {isGridOpen && showQuestionGrid ? (
        <PracticeQuestionGridPanel
          onClose={() => setIsGridOpen(false)}
          onSelect={(questionId) => {
            onQuestionGridSelect(questionId);
          }}
          sections={questionGridSections}
        />
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">{leftSlot}</div>
        <div className="flex items-center justify-end gap-2">
          <button
            aria-label={t("tests.previous")}
            className={iconOnlyButtonClassName(
              "border border-border bg-transparent text-foreground enabled:hover:bg-hover-overlay",
            )}
            disabled={previousDisabled}
            onClick={onPrevious}
            type="button"
          >
            <ArrowBackIcon />
          </button>
          {showQuestionGrid ? (
            <button
              aria-label={
                showQuestionPosition
                  ? formatMessage(t("tests.questionListWithPosition"), {
                      current: currentQuestionNumber,
                      total: totalQuestions,
                    })
                  : t("tests.questionList")
              }
              className={iconOnlyButtonClassName(
                "w-auto gap-1.5 border border-border bg-transparent px-2 text-foreground hover:bg-hover-overlay",
              )}
              onClick={() => setIsGridOpen(true)}
              type="button"
            >
              <GridViewIcon />
              {showQuestionPosition ? (
                <span className="tabular-nums text-sm font-normal">
                  {currentQuestionNumber}/{totalQuestions}
                </span>
              ) : null}
            </button>
          ) : showQuestionPosition ? (
            <span
              aria-label={formatMessage(t("tests.questionPosition"), {
                current: currentQuestionNumber,
                total: totalQuestions,
              })}
              className="tabular-nums text-sm text-foreground"
            >
              {currentQuestionNumber}/{totalQuestions}
            </span>
          ) : null}
          <button
            aria-label={resolvedNextAriaLabel}
            className={iconOnlyButtonClassName(
              "border border-border bg-transparent text-foreground enabled:hover:bg-hover-overlay",
            )}
            disabled={nextDisabled}
            onClick={onNext}
            type="button"
          >
            <ArrowForwardIcon />
          </button>
        </div>
      </div>
    </>
  );
}
