import {
  hasContextEvidenceMarkers,
  parseContextEvidence,
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

function toPassageInlines(content: string): PassageInline[] {
  if (!hasContextEvidenceMarkers(content)) {
    return [{ type: "text", value: content }];
  }

  return parseContextEvidence(content);
}

function toPassageBlock(
  block: { type: PassageBlock["type"]; raw: string },
): PassageBlock {
  return {
    type: block.type,
    inlines: toPassageInlines(block.raw),
  };
}

export function parsePassageContent(content: string): ParsePassageContentResult {
  if (hasPassageFormatMarkers(content)) {
    if (!isValidPassageBlockMarkup(content)) {
      return { kind: "raw", content };
    }

    const rawBlocks = parsePassageBlocks(content);
    if (!rawBlocks) {
      return { kind: "raw", content };
    }

    return {
      kind: "parsed",
      blocks: rawBlocks.map(toPassageBlock),
    };
  }

  return {
    kind: "parsed",
    blocks: [
      {
        type: "plain",
        inlines: toPassageInlines(content),
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
    block.inlines.some((inline) => inline.type === "evidence"),
  );
}
