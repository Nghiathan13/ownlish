"use client";

import { useState } from "react";
import { PracticeQuestionGridPanel } from "@/features/tests/run/components/PracticeQuestionGridPanel";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
import type { ReactNode } from "react";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { GridViewIcon } from "@/shared/ui/icons/GridViewIcon";

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
  nextAriaLabel = "Next",
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
            aria-label="Previous"
            className={iconOnlyButtonClassName(
              "border border-border bg-transparent text-foreground enabled:hover:border-foreground",
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
                  ? `Question list, question ${currentQuestionNumber} of ${totalQuestions}`
                  : "Question list"
              }
              className={iconOnlyButtonClassName(
                "w-auto gap-1.5 border border-border bg-transparent px-2 text-foreground hover:border-foreground",
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
              aria-label={`Question ${currentQuestionNumber} of ${totalQuestions}`}
              className="tabular-nums text-sm text-foreground"
            >
              {currentQuestionNumber}/{totalQuestions}
            </span>
          ) : null}
          <button
            aria-label={nextAriaLabel}
            className={iconOnlyButtonClassName(
              "border border-border bg-transparent text-foreground enabled:hover:border-foreground",
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
