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
  "mr-1 inline-grid place-items-center align-middle shrink-0";
const evidenceBadgeClassName =
  "relative -top-[0.03125em] inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[0.625rem] font-semibold leading-none tabular-nums text-amber-800 ring-1 ring-amber-300/70 bg-amber-50 dark:text-amber-300 dark:ring-amber-700/60 dark:bg-amber-950/60";  
const evidenceHighlightClassName =
  "bg-amber-100/80 px-0.5 box-decoration-clone dark:bg-amber-900/35";

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
