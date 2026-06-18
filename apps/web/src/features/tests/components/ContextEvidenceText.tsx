import { Fragment } from "react";
import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/lib/parseContextEvidence";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

const evidenceBadgeBoxClassName =
  "mr-1 inline-grid h-[1lh] min-w-[1lh] place-items-center align-middle rounded px-0.5 shrink-0 text-amber-800 ring-1 ring-amber-300/70 bg-amber-50 dark:text-amber-300 dark:ring-amber-700/60 dark:bg-amber-950/60";

const evidenceBadgeTextClassName =
  "text-[0.625rem] font-semibold leading-none tabular-nums";

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
            <span aria-hidden className={evidenceBadgeBoxClassName}>
              <span className={evidenceBadgeTextClassName}>
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
