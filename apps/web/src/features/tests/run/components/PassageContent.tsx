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

const passageShellClassName = "p-4 whitespace-pre-wrap text-base";

function PassageBlockView({
  block,
  highlightEvidence,
  inCenterBlock = false,
  stripEvidence,
}: {
  block: PassageBlock;
  highlightEvidence: boolean;
  inCenterBlock?: boolean;
  stripEvidence: boolean;
}) {
  if (block.type === "passage") {
    return (
      <div
        className={classNames(
          passageShellClassName,
          block.border && "rounded-sm border border-border",
        )}
      >
        {block.blocks.map((child, childIndex) => (
          <PassageBlockView
            block={child}
            highlightEvidence={highlightEvidence}
            key={`passage-child-${childIndex}`}
            stripEvidence={stripEvidence}
          />
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <PassageTableView
        blockCenter={inCenterBlock}
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
      <div className="w-full text-center">
        {block.blocks.map((child, childIndex) => (
          <PassageBlockView
            block={child}
            highlightEvidence={highlightEvidence}
            inCenterBlock
            key={`center-child-${childIndex}`}
            stripEvidence={stripEvidence}
          />
        ))}
      </div>
    );
  }

  return (
    <PassageInlines
      highlightEvidence={highlightEvidence}
      inlines={block.inlines}
      stripEvidence={stripEvidence}
    />
  );
}

function PassageRawView({ content }: { content: string }) {
  return <div className={passageShellClassName}>{content}</div>;
}

export function PassageContent({
  content,
  highlightEvidence,
  showRawEvidenceWhenOff = false,
}: PassageContentProps) {
  const parsed = parsePassageContent(content);

  if (parsed.kind === "raw") {
    return <PassageRawView content={content} />;
  }

  const hasEvidence = passageContentHasEvidence(content);

  if (hasEvidence && !highlightEvidence && showRawEvidenceWhenOff) {
    return <PassageRawView content={content} />;
  }

  const stripEvidence = hasEvidence && !highlightEvidence;

  return (
    <>
      {parsed.blocks.map((block, index) => (
        <Fragment key={`${block.type}-${index}`}>
          <PassageBlockView
            block={block}
            highlightEvidence={highlightEvidence}
            stripEvidence={stripEvidence}
          />
        </Fragment>
      ))}
    </>
  );
}
