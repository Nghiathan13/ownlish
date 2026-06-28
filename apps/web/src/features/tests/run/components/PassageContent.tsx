import { Fragment } from "react";
import { classNames } from "@/shared/lib/classNames";
import { PassageInlines } from "@/features/tests/run/components/PassageInlines";
import { PassageTableView } from "@/features/tests/run/components/PassageTableView";
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

function PassageBlockView({
  block,
  highlightEvidence,
  inCenter = false,
  stripEvidence,
}: {
  block: PassageBlock;
  highlightEvidence: boolean;
  inCenter?: boolean;
  stripEvidence: boolean;
}) {
  if (block.type === "table") {
    return (
      <PassageTableView
        blockCenter={inCenter}
        bold={block.bold}
        center={block.center}
        highlightEvidence={highlightEvidence}
        rows={block.rows}
        stripEvidence={stripEvidence}
        widthPercent={block.widthPercent}
      />
    );
  }

  if (block.type === "center") {
    return (
      <div className="flex w-full flex-col items-center">
        {block.blocks.map((child, childIndex) => (
          <PassageBlockView
            block={child}
            highlightEvidence={highlightEvidence}
            inCenter
            key={`center-child-${childIndex}`}
            stripEvidence={stripEvidence}
          />
        ))}
      </div>
    );
  }

  const inlines = (
    <PassageInlines
      highlightEvidence={highlightEvidence}
      inlines={block.inlines}
      stripEvidence={stripEvidence}
    />
  );

  if (block.type === "plain" && inCenter) {
    return <div className="w-full text-center">{inlines}</div>;
  }

  return inlines;
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
