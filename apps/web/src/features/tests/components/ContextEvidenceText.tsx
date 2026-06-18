import { Fragment } from "react";
import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/lib/parseContextEvidence";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

const evidenceBadgeClassName =
  "mr-1 inline-block h-[1.2em] min-w-[1.2em] align-middle rounded px-0.5 text-center text-[0.625rem] font-semibold leading-[1.2em] tabular-nums text-amber-800 ring-1 ring-amber-300/70 bg-amber-50 dark:text-amber-300 dark:ring-amber-700/60 dark:bg-amber-950/60";

const evidenceHighlightClassName =
  "bg-amber-100/80 box-decoration-clone dark:bg-amber-900/35";

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
            <span aria-hidden className={evidenceBadgeClassName}>
              {segment.questionNumber}
            </span>
            <span className={evidenceHighlightClassName}>{segment.value}</span>
          </Fragment>
        );
      })}
    </span>
  );
}
