import { Fragment } from "react";
import { classNames } from "@/shared/lib/classNames";
import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/lib/parseContextEvidence";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

const evidenceBadgeSlotClassName =
  "relative -top-[1px] mr-1 inline-grid place-items-center align-middle shrink-0";
const evidenceBadgeClassName = classNames(
  "relative -top-[0.5px] inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[0.625rem] font-semibold leading-none tabular-nums ring-1 ring-current",
  statusColorClasses.amber.text,
);
const evidenceHighlightClassName = classNames(
  statusColorClasses.amber.background,
  "box-decoration-clone px-0.5",
);

export function ContextEvidenceText({
  content,
  className,
}: ContextEvidenceTextProps) {
  if (!hasContextEvidenceMarkers(content)) {
    return <>{content}</>;
  }

  const segments = parseContextEvidence(content);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={`text-${index}`}>{segment.value}</span>;
        }

        return (
          <Fragment key={`evidence-${segment.questionNumber}-${index}`}>
            <span aria-hidden className={evidenceBadgeSlotClassName}>
              <span className={evidenceBadgeClassName}>
                {segment.questionNumber}
              </span>
            </span>
            <span className={evidenceHighlightClassName}>{segment.value}</span>
          </Fragment>
        );
      })}
    </span>
  );
}
