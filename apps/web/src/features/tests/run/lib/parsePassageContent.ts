import {
  hasContextEvidenceMarkers,
} from "@/features/tests/run/lib/parseContextEvidence";
import type {
  ParsePassageContentResult,
  PassageBlock,
  PassageInline,
} from "@/features/tests/run/lib/passageContent.types";
import {
  hasPassageFormatMarkers,
  isValidPassageBlockMarkup,
  parsePassageBlocks,
} from "@/features/tests/run/lib/parsePassageBlocks";
import {
  hasPassageInlineFormatMarkers,
  isValidPassageInlineMarkup,
  parsePassageInlines,
} from "@/features/tests/run/lib/parsePassageInlines";

function toPassageBlock(
  block: { type: PassageBlock["type"]; raw: string },
): PassageBlock | null {
  const inlines = parsePassageInlines(block.raw);
  if (!inlines) {
    return null;
  }

  return {
    type: block.type,
    inlines,
  };
}

function inlineHasEvidence(inline: PassageInline): boolean {
  if (inline.type === "evidence") {
    return true;
  }

  if (inline.type === "bold") {
    return inline.inlines.some(inlineHasEvidence);
  }

  return false;
}

export function parsePassageContent(content: string): ParsePassageContentResult {
  if (hasPassageInlineFormatMarkers(content) && !isValidPassageInlineMarkup(content)) {
    return { kind: "raw", content };
  }

  if (hasPassageFormatMarkers(content)) {
    if (!isValidPassageBlockMarkup(content)) {
      return { kind: "raw", content };
    }

    const rawBlocks = parsePassageBlocks(content);
    if (!rawBlocks) {
      return { kind: "raw", content };
    }

    const blocks = rawBlocks
      .map(toPassageBlock)
      .filter((block): block is PassageBlock => block !== null);

    if (blocks.length !== rawBlocks.length) {
      return { kind: "raw", content };
    }

    return {
      kind: "parsed",
      blocks,
    };
  }

  const inlines = parsePassageInlines(content);
  if (!inlines) {
    return { kind: "raw", content };
  }

  return {
    kind: "parsed",
    blocks: [
      {
        type: "plain",
        inlines,
      },
    ],
  };
}

export function passageContentHasEvidence(content: string) {
  const parsed = parsePassageContent(content);
  if (parsed.kind === "raw") {
    return hasContextEvidenceMarkers(content);
  }

  return parsed.blocks.some((block) =>
    block.inlines.some(inlineHasEvidence),
  );
}
