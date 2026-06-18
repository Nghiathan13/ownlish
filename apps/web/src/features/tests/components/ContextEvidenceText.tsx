import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/lib/parseContextEvidence";
import { classNames } from "@/shared/lib/classNames";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

const evidenceBadgeClassName =
  "mr-1 inline-flex min-w-[1.1rem] shrink-0 items-center justify-center rounded px-1 py-px text-[10px] font-semibold tabular-nums leading-none text-muted-foreground ring-1 ring-border/70 bg-background/80 align-baseline";

const evidenceHighlightClassName =
  "rounded-[3px] bg-muted/80 px-0.5 py-px box-decoration-clone dark:bg-muted/45";

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
          <span className="inline" key={`evidence-${segment.questionNumber}-${index}`}>
            <span aria-hidden className={evidenceBadgeClassName}>
              {segment.questionNumber}
            </span>
            <span className={classNames(evidenceHighlightClassName)}>
              {segment.value}
            </span>
          </span>
        );
      })}
    </span>
  );
}
