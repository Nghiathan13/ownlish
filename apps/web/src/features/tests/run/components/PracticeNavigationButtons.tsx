"use client";

import { useState, type ReactNode } from "react";
import { PracticeQuestionGridPanel } from "@/features/tests/run/components/PracticeQuestionGridPanel";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
import { iconOnlyButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { GridViewIcon } from "@/shared/ui/icons/GridViewIcon";

type PracticeNavigationButtonsProps = {
  leftSlot?: ReactNode;
  navigationDisabled?: boolean;
  nextAriaLabel?: string;
  nextDisabled?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  previousDisabled?: boolean;
  questionGridSections?: QuestionGridSection[];
  onQuestionGridSelect?: (questionId: number) => void;
  isQuestionGridOpen?: boolean;
  onQuestionGridOpenChange?: (open: boolean) => void;
};

export function PracticeNavigationButtons({
  leftSlot,
  navigationDisabled = false,
  nextAriaLabel = "Next",
  nextDisabled = false,
  onNext,
  onPrevious,
  previousDisabled = false,
  questionGridSections,
  onQuestionGridSelect,
  isQuestionGridOpen,
  onQuestionGridOpenChange,
}: PracticeNavigationButtonsProps) {
  const [internalGridOpen, setInternalGridOpen] = useState(false);
  const isGridOpen = isQuestionGridOpen ?? internalGridOpen;
  const setIsGridOpen = onQuestionGridOpenChange ?? setInternalGridOpen;
  const showQuestionGrid =
    questionGridSections != null &&
    questionGridSections.some((section) => section.cells.length > 0) &&
    onQuestionGridSelect != null;

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center">{leftSlot ?? null}</div>
        <div className="flex items-center justify-end gap-2">
        <button
          aria-label="Previous"
          className={iconOnlyButtonClassName(
            "border border-border bg-transparent text-foreground enabled:hover:border-foreground",
          )}
          disabled={previousDisabled || navigationDisabled}
          onClick={onPrevious}
          type="button"
        >
          <ArrowBackIcon />
        </button>
        {showQuestionGrid ? (
          <button
            aria-label="Question list"
            className={iconOnlyButtonClassName(
              "border border-border bg-transparent text-foreground hover:border-foreground",
            )}
            disabled={navigationDisabled}
            onClick={() => setIsGridOpen(true)}
            type="button"
          >
            <GridViewIcon />
          </button>
        ) : null}
        <button
          aria-label={nextAriaLabel}
          className={iconOnlyButtonClassName(
            "border border-border bg-transparent text-foreground enabled:hover:border-foreground",
          )}
          disabled={nextDisabled || navigationDisabled}
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
