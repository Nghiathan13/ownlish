import type { ContentEvidenceSegment } from "@/entities/toeic-runtime";
import { PassageInlines } from "@/features/tests/run/ui/PassageInlines";

type StructuredEvidenceTextProps = {
  highlightEvidence: boolean;
  segments: ContentEvidenceSegment[];
};

export function StructuredEvidenceText({
  highlightEvidence,
  segments,
}: StructuredEvidenceTextProps) {
  return (
    <div className="p-4 whitespace-pre-wrap text-base">
      <PassageInlines
        highlightEvidence={highlightEvidence}
        inlines={segments}
        stripEvidence={false}
      />
    </div>
  );
}
