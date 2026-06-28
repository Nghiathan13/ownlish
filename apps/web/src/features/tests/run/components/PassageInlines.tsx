import { Fragment, type ReactNode } from "react";
import { classNames } from "@/shared/lib/classNames";
import type { PassageInline } from "@/features/tests/run/lib/passageContent.types";
import { statusColorClasses } from "@/shared/ui/theme/statusColors";

type PassageInlinesProps = {
  highlightEvidence: boolean;
  inlines: PassageInline[];
  stripEvidence: boolean;
};

type RenderPassageInlineContext = {
  highlightEvidence: boolean;
  insideBold: boolean;
  stripEvidence: boolean;
};

const evidenceBadgeSlotClassName =
  "relative -top-[1px] mr-1 inline-flex items-center gap-1 align-middle shrink-0";
const evidenceBadgeClassName = classNames(
  "relative -top-[0.5px] inline-flex h-4 min-w-4 items-center justify-center rounded px-0.5 text-[0.625rem] font-semibold leading-none tabular-nums ring-1 ring-current",
  statusColorClasses.amber.text,
);
const evidenceHighlightClassName = classNames(
  statusColorClasses.amber.background,
  "box-decoration-clone px-0.5",
);

function renderPassageInline(
  inline: PassageInline,
  index: number,
  context: RenderPassageInlineContext,
): ReactNode {
  if (inline.type === "text") {
    if (context.insideBold) {
      return <Fragment key={`text-${index}`}>{inline.value}</Fragment>;
    }

    return <span key={`text-${index}`}>{inline.value}</span>;
  }

  if (inline.type === "bold") {
    const singleText =
      inline.inlines.length === 1 && inline.inlines[0]?.type === "text"
        ? inline.inlines[0]
        : null;

    if (singleText) {
      return (
        <span className="font-bold" key={`bold-${index}`}>
          {singleText.value}
        </span>
      );
    }

    return (
      <span className="font-bold" key={`bold-${index}`}>
        {inline.inlines.map((child, childIndex) =>
          renderPassageInline(child, childIndex, {
            ...context,
            insideBold: true,
          }),
        )}
      </span>
    );
  }

  if (context.stripEvidence || !context.highlightEvidence) {
    if (context.insideBold) {
      return <Fragment key={`evidence-${index}`}>{inline.value}</Fragment>;
    }

    return <span key={`evidence-${index}`}>{inline.value}</span>;
  }

  return (
    <Fragment key={`evidence-${inline.questionNumbers.join("-")}-${index}`}>
      <span aria-hidden className={evidenceBadgeSlotClassName}>
        {inline.questionNumbers.map((questionNumber) => (
          <span className={evidenceBadgeClassName} key={questionNumber}>
            {questionNumber}
          </span>
        ))}
      </span>
      <span className={evidenceHighlightClassName}>{inline.value}</span>
    </Fragment>
  );
}

export function PassageInlines({
  highlightEvidence,
  inlines,
  stripEvidence,
}: PassageInlinesProps) {
  const context: RenderPassageInlineContext = {
    highlightEvidence,
    insideBold: false,
    stripEvidence,
  };

  return inlines.map((inline, index) =>
    renderPassageInline(inline, index, context),
  );
}
