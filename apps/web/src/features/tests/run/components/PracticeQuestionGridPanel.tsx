"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { classNames } from "@/shared/lib/classNames";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";

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
        className="absolute inset-y-0 right-0 flex w-fit max-w-[85vw] flex-col overflow-y-auto border-l border-border bg-background p-4 shadow-xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <section className="flex flex-col gap-2" key={section.partNumber}>
              <h3 className="text-base font-semibold">
                Part {section.partNumber}
              </h3>
              <div className="grid grid-cols-[repeat(6,2.5rem)] gap-2">
                {section.cells.map((cell) => (
                  <button
                    className={classNames(
                      "flex size-10 shrink-0 items-center justify-center rounded-md border text-sm tabular-nums",
                      cell.result === "correct" &&
                        classNames(
                          statusColorClasses.success.border,
                          statusColorClasses.success.background,
                          statusColorClasses.success.text,
                          "font-medium",
                        ),
                      cell.result === "wrong" &&
                        classNames(
                          statusColorClasses.danger.border,
                          statusColorClasses.danger.background,
                          statusColorClasses.danger.text,
                          "font-medium",
                        ),
                      cell.result == null &&
                        cell.isSelected &&
                        "border-foreground bg-muted font-medium text-foreground",
                      cell.result == null &&
                        !cell.isSelected &&
                        "border-border bg-background font-normal text-foreground hover:border-foreground",
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
