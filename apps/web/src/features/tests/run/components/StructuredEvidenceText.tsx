import type { ContentEvidenceSegment } from "@/entities/toeic-runtime/model/presentation";
import { PassageInlines } from "@/features/tests/run/components/PassageInlines";

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
