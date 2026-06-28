import { Fragment } from "react";
import { classNames } from "@/shared/lib/classNames";
import type { PassageInline } from "@/features/tests/run/lib/passageContent.types";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type PassageInlinesProps = {
  className?: string;
  highlightEvidence: boolean;
  inlines: PassageInline[];
  stripEvidence: boolean;
};

const evidenceBadgeSlotClassName =
  "relative -top-[1px] mr-1 inline-flex items-center gap-1 align-middle shrink-0";
const evidenceBadgeClassName = classNames(
  "relative -top-[0.5px] inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[0.625rem] font-semibold leading-none tabular-nums ring-1 ring-current",
  statusColorClasses.amber.text,
);
const evidenceHighlightClassName = classNames(
  statusColorClasses.amber.background,
  "box-decoration-clone px-0.5",
);

export function PassageInlines({
  className,
  highlightEvidence,
  inlines,
  stripEvidence,
}: PassageInlinesProps) {
  return (
    <span className={className}>
      {inlines.map((inline, index) => {
        if (inline.type === "text") {
          return <span key={`text-${index}`}>{inline.value}</span>;
        }

        if (inline.type === "bold") {
          return (
            <strong key={`bold-${index}`}>
              <PassageInlines
                highlightEvidence={highlightEvidence}
                inlines={inline.inlines}
                stripEvidence={stripEvidence}
              />
            </strong>
          );
        }

        if (stripEvidence || !highlightEvidence) {
          return <span key={`evidence-${index}`}>{inline.value}</span>;
        }

        return (
          <Fragment key={`evidence-${inline.questionNumbers.join("-")}-${index}`}>
            <span aria-hidden className={evidenceBadgeSlotClassName}>
              {inline.questionNumbers.map((questionNumber) => (
                <span className={evidenceBadgeClassName} key={questionNumber}>
                  {questionNumber}
                </span>
              ))}
            </span>
            <span className={evidenceHighlightClassName}>{inline.value}</span>
          </Fragment>
        );
      })}
    </span>
  );
}
