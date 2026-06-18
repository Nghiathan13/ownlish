"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { classNames } from "@/shared/lib/classNames";
import {
  practiceCorrectClasses,
  practiceWrongClasses,
} from "@/features/tests/lib/practiceGradingClasses";
import type { QuestionGridSection } from "@/features/tests/lib/practiceQuestionGrid";

type PracticeQuestionGridPanelProps = {
  sections: QuestionGridSection[];
  onClose: () => void;
  onSelect: (questionNumber: number) => void;
};

export function PracticeQuestionGridPanel({
  sections,
  onClose,
  onSelect,
}: PracticeQuestionGridPanelProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      <button
        aria-label="Close question list"
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        className="absolute inset-y-0 left-0 flex w-[min(360px,85vw)] flex-col overflow-y-auto border-r border-border bg-background p-4 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <section className="flex flex-col gap-2" key={section.partNumber}>
              <h3 className="text-base font-semibold">
                Part {section.partNumber}
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.cells.map((cell) => (
                  <button
                    className={classNames(
                      "flex size-8 shrink-0 items-center justify-center rounded-md border text-sm font-normal tabular-nums transition",
                      cell.result === "correct" && practiceCorrectClasses,
                      cell.result === "wrong" && practiceWrongClasses,
                      cell.isActive &&
                        "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                      cell.isActive &&
                        cell.result == null &&
                        "border-foreground bg-muted text-foreground",
                      !cell.isActive &&
                        cell.result == null &&
                        "border-border bg-background text-foreground hover:border-foreground hover:bg-muted/60",
                    )}
                    key={cell.questionNumber}
                    onClick={() => onSelect(cell.questionNumber)}
                    type="button"
                  >
                    {cell.questionNumber}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
