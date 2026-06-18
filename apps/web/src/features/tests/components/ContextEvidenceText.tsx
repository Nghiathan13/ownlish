import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
} from "@/features/tests/lib/parseContextEvidence";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

const evidenceBadgeClassName =
  "mr-1 inline-flex min-w-[1.1rem] shrink-0 items-center justify-center self-center rounded px-1 py-px text-[10px] font-semibold tabular-nums leading-none text-amber-800 ring-1 ring-amber-300/70 bg-amber-50 dark:text-amber-300 dark:ring-amber-700/60 dark:bg-amber-950/60";

const evidenceHighlightClassName =
  "rounded-[3px] bg-amber-100/80 px-0.5 py-px box-decoration-clone dark:bg-amber-900/35";

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
          <span
            className="inline-flex items-center align-middle"
            key={`evidence-${segment.questionNumber}-${index}`}
          >
            <span aria-hidden className={evidenceBadgeClassName}>
              {segment.questionNumber}
            </span>
            <span className={evidenceHighlightClassName}>
              {segment.value}
            </span>
          </span>
        );
      })}
    </span>
  );
}
