import { Fragment } from "react";
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

const formattedBlockClassNames: Partial<Record<PassageBlock["type"], string>> = {
  center: "block w-full text-center",
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
  const inlines = (
    <PassageInlines
      highlightEvidence={highlightEvidence}
      inlines={block.inlines}
      stripEvidence={stripEvidence}
    />
  );

  if (block.type === "plain") {
    return inlines;
  }

  return (
    <div className={formattedBlockClassNames[block.type]}>
      {inlines}
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
    <div className={classNames("whitespace-pre-wrap text-base")}>
      {parsed.blocks.map((block, index) => (
        <Fragment key={`${block.type}-${index}`}>
          <PassageBlockView
            block={block}
            highlightEvidence={highlightEvidence}
            stripEvidence={stripEvidence}
          />
        </Fragment>
      ))}
    </div>
  );
}
