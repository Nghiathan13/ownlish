"use client";

import { useState } from "react";
import { PracticeQuestionGridPanel } from "@/features/tests/run/components/PracticeQuestionGridPanel";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
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
  onQuestionGridSelect?: (questionNumber: number) => void;
  isQuestionGridOpen?: boolean;
  onQuestionGridOpenChange?: (open: boolean) => void;
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
          onSelect={(questionNumber) => {
            onQuestionGridSelect(questionNumber);
          }}
          sections={questionGridSections}
        />
      ) : null}
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
            aria-label="Question list"
            className={iconOnlyButtonClassName(
              "border border-border bg-transparent text-foreground hover:border-foreground",
            )}
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
          disabled={nextDisabled}
          onClick={onNext}
          type="button"
        >
          <ArrowForwardIcon />
        </button>
      </div>
    </>
  );
}
