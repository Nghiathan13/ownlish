import {
  hasContextEvidenceMarkers,
} from "@/features/tests/run/lib/parseContextEvidence";
import type {
  ParsePassageContentResult,
  PassageBlock,
  PassageInline,
  PassageTableRow,
} from "@/features/tests/run/lib/passageContent.types";
import {
  hasPassageFormatMarkers,
  isValidPassageBlockMarkup,
  parsePassageBlocks,
  type RawPassageBlock,
} from "@/features/tests/run/lib/parsePassageBlocks";
import {
  hasPassageInlineFormatMarkers,
  isValidPassageInlineMarkup,
  parsePassageInlines,
} from "@/features/tests/run/lib/parsePassageInlines";
import { parsePassageTable } from "@/features/tests/run/lib/parsePassageTable";

function toPassageBlock(block: RawPassageBlock): PassageBlock | null {
  if (block.type === "table") {
    const table = parsePassageTable(block.raw);
    if (!table) {
      return null;
    }

    return {
      type: "table",
      bold: block.tableAttrs.bold,
      center: block.tableAttrs.center,
      widthPercent: block.tableAttrs.widthPercent,
      rows: table.rows,
    };
  }

  const inlines = parsePassageInlines(block.raw);
  if (!inlines) {
    return null;
  }

  return {
    type: block.type,
    inlines,
  } as PassageBlock;
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

function tableRowHasEvidence(row: PassageTableRow) {
  return row.cols.some((col) => col.inlines.some(inlineHasEvidence));
}

function blockHasEvidence(block: PassageBlock) {
  if (block.type === "table") {
    return block.rows.some(tableRowHasEvidence);
  }

  return block.inlines.some(inlineHasEvidence);
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

  return parsed.blocks.some(blockHasEvidence);
}
