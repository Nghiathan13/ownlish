import { PassageContent } from "@/features/tests/run/components/PassageContent";
import {
  hasContextEvidenceMarkers,
} from "@/features/tests/run/lib/parseContextEvidence";

type ContextEvidenceTextProps = {
  content: string;
  className?: string;
};

export function ContextEvidenceText({
  content,
  className,
}: ContextEvidenceTextProps) {
  if (!hasContextEvidenceMarkers(content)) {
    return <span className={className}>{content}</span>;
  }

  return (
    <div className={className}>
      <PassageContent content={content} highlightEvidence />
    </div>
  );
}
