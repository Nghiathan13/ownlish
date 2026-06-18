import { Fragment } from "react";
import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/lib/parseContextEvidence";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

const evidenceBadgeSlotClassName =
  "relative -top-[1px] mr-1 inline-grid place-items-center align-middle shrink-0";
const evidenceBadgeClassName =
  "relative -top-[0.5px] inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[0.625rem] font-semibold leading-none tabular-nums text-amber-800 ring-1 ring-amber-800 dark:text-amber-200 dark:ring-amber-200";  
const evidenceHighlightClassName =
  "bg-amber-100/70 px-0.5 box-decoration-clone dark:bg-amber-900/70";

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
