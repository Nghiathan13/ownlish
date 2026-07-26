"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { classNames } from "@/shared/lib/classNames";
import { formatMessage } from "@/shared/i18n/messages";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";
import type { QuestionGridSection } from "@/features/tests/run/lib/practiceQuestionGrid";
import { useT } from "@/shared/providers/LocaleProvider";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";

type PracticeQuestionGridPanelProps = {
  sections: QuestionGridSection[];
  onClose: () => void;
  onSelect: (questionId: number) => void;
};

function countGridSummary(sections: QuestionGridSection[]) {
  let correct = 0;
  let wrong = 0;
  let answered = 0;

  for (const section of sections) {
    for (const cell of section.cells) {
      if (cell.result === "correct") {
        correct += 1;
      } else if (cell.result === "wrong") {
        wrong += 1;
      } else if (cell.isSelected) {
        answered += 1;
      }
    }
  }

  return { correct, wrong, answered };
}

export function PracticeQuestionGridPanel({
  sections,
  onClose,
  onSelect,
}: PracticeQuestionGridPanelProps) {
  const t = useT();
  const summary = useMemo(() => countGridSummary(sections), [sections]);
  const showResultLegend = useMemo(
    () =>
      sections.some((section) =>
        section.cells.some((cell) => cell.result != null),
      ),
    [sections],
  );
  const showAnsweredLegend = !showResultLegend || summary.answered > 0;

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
        aria-label={t("tests.closeQuestionList")}
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <aside
        className="absolute inset-y-0 right-0 flex w-fit max-w-[85vw] flex-col border-l border-border bg-surface"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header
          className={classNames(
            "grid shrink-0 gap-x-4 gap-y-2 border-b border-border px-4 py-3",
            showResultLegend ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {showResultLegend ? (
            <>
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
                <span
                  aria-hidden
                  className={classNames(
                    "size-5 shrink-0 rounded-[4px] border",
                    statusColorClasses.success.border,
                    statusColorClasses.success.background,
                  )}
                />
                <span className="truncate">{t("tests.gridLegendCorrect")}</span>
                <span
                  className={classNames(
                    "font-semibold tabular-nums",
                    statusColorClasses.success.text,
                  )}
                >
                  {summary.correct}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
                <span
                  aria-hidden
                  className={classNames(
                    "size-5 shrink-0 rounded-[4px] border",
                    statusColorClasses.danger.border,
                    statusColorClasses.danger.background,
                  )}
                />
                <span className="truncate">{t("tests.gridLegendWrong")}</span>
                <span
                  className={classNames(
                    "font-semibold tabular-nums",
                    statusColorClasses.danger.text,
                  )}
                >
                  {summary.wrong}
                </span>
              </div>
            </>
          ) : null}
          {showAnsweredLegend ? (
            <div className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
              <span
                aria-hidden
                className="size-5 shrink-0 rounded-[4px] border border-foreground bg-muted"
              />
              <span className="truncate">{t("tests.gridLegendAnswered")}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {summary.answered}
              </span>
            </div>
          ) : null}
        </header>
        <OverlayScrollArea
          centerSelector='[data-active-question="true"]'
          className="h-full min-h-0 p-4"
          rootClassName="min-h-0 flex-1"
        >
          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <section className="flex flex-col gap-2" key={section.partNumber}>
                <h3 className="text-base font-semibold">
                  {formatMessage(t("tests.partNumber"), {
                    number: section.partNumber,
                  })}
                </h3>
                <div className="grid grid-cols-[repeat(6,2.5rem)] gap-2">
                  {section.cells.map((cell) => (
                    <button
                      className={classNames(
                        "relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border text-sm tabular-nums",
                        cell.result === "correct" &&
                          classNames(
                            statusColorClasses.success.border,
                            statusColorClasses.success.background,
                            statusColorClasses.success.text,
                            "font-medium before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-hover-overlay before:opacity-0 hover:before:opacity-100",
                          ),
                        cell.result === "wrong" &&
                          classNames(
                            statusColorClasses.danger.border,
                            statusColorClasses.danger.background,
                            statusColorClasses.danger.text,
                            "font-medium before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-hover-overlay before:opacity-0 hover:before:opacity-100",
                          ),
                        cell.result == null &&
                          cell.isSelected &&
                          "border-foreground bg-muted font-medium text-foreground before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-hover-overlay before:opacity-0 hover:before:opacity-100",
                        cell.result == null &&
                          !cell.isSelected &&
                          "border-border bg-surface font-normal text-foreground hover:bg-hover-overlay",
                        cell.isActive &&
                          "ring-1 ring-foreground ring-offset-2 ring-offset-background",
                      )}
                      data-active-question={cell.isActive ? "true" : undefined}
                      key={cell.questionId}
                      onClick={() => onSelect(cell.questionId)}
                      type="button"
                    >
                      <span className="relative z-10">{cell.displayNumber}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </OverlayScrollArea>
      </aside>
    </div>,
    document.body,
  );
}
