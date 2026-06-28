import { classNames } from "@/shared/lib/classNames";
import { PassageInlines } from "@/features/tests/run/components/PassageInlines";
import type { PassageBlock } from "@/features/tests/run/lib/passageContent.types";
import {
  parsePassageContent,
  passageContentHasEvidence,
} from "@/features/tests/run/lib/parsePassageContent";

type PassageContentProps = {
  content: string;
  highlightEvidence: boolean;
  showRawEvidenceWhenOff?: boolean;
};

const blockClassNames: Record<PassageBlock["type"], string> = {
  plain: "whitespace-pre-wrap",
  center: "w-full whitespace-pre-wrap text-center",
};

function PassageBlockView({
  block,
  highlightEvidence,
  stripEvidence,
}: {
  block: PassageBlock;
  highlightEvidence: boolean;
  stripEvidence: boolean;
}) {
  return (
    <div className={blockClassNames[block.type]}>
      <PassageInlines
        highlightEvidence={highlightEvidence}
        inlines={block.inlines}
        stripEvidence={stripEvidence}
      />
    </div>
  );
}

export function PassageContent({
  content,
  highlightEvidence,
  showRawEvidenceWhenOff = false,
}: PassageContentProps) {
  const parsed = parsePassageContent(content);

  if (parsed.kind === "raw") {
    return <div className="whitespace-pre-wrap text-base">{content}</div>;
  }

  const hasEvidence = passageContentHasEvidence(content);

  if (hasEvidence && !highlightEvidence && showRawEvidenceWhenOff) {
    return <div className="whitespace-pre-wrap text-base">{content}</div>;
  }

  const stripEvidence = hasEvidence && !highlightEvidence;

  return (
    <div className={classNames("text-base")}>
      {parsed.blocks.map((block, index) => (
        <PassageBlockView
          block={block}
          highlightEvidence={highlightEvidence}
          key={`${block.type}-${index}`}
          stripEvidence={stripEvidence}
        />
      ))}
    </div>
  );
}
