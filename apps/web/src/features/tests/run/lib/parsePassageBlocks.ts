import type { PassageBlock } from "@/features/tests/run/lib/passageContent.types";
import {
  findTableCloseIndex,
  findTableOpenIndex,
  getEmptyTableWrapperAttrs,
  hasTableWrapperMarkers,
  parseTableCloseTag,
  parseTableOpenTag,
  type TableWrapperAttrs,
} from "@/features/tests/run/lib/parsePassageTableWrapper";

export type RawPassageBlock =
  | { type: "plain"; raw: string }
  | { type: "center"; children: RawPassageBlock[] }
  | { type: "table"; raw: string; tableAttrs: TableWrapperAttrs };

type ParseRawBlocksOptions = {
  allowCenter: boolean;
};

const CENTER_OPEN = "[center]";
const CENTER_CLOSE = "[/center]";

type BlockMarker =
  | { index: number; kind: "center"; isClose: boolean }
  | {
      index: number;
      kind: "table";
      isClose: boolean;
      tableAttrs: TableWrapperAttrs;
      length: number;
    };

function findNextBlockMarker(content: string, fromIndex: number): BlockMarker | null {
  const centerOpen = content.indexOf(CENTER_OPEN, fromIndex);
  const centerClose = content.indexOf(CENTER_CLOSE, fromIndex);
  const tableOpen = findTableOpenIndex(content, fromIndex);
  const tableClose = findTableCloseIndex(content, fromIndex);

  let next: BlockMarker | null = null;

  if (centerOpen >= 0) {
    next = { index: centerOpen, kind: "center", isClose: false };
  }

  if (centerClose >= 0 && (!next || centerClose < next.index)) {
    next = { index: centerClose, kind: "center", isClose: true };
  }

  if (tableOpen >= 0) {
    const parsedOpen = parseTableOpenTag(content, tableOpen);
    if (parsedOpen && (!next || tableOpen < next.index)) {
      next = {
        index: tableOpen,
        kind: "table",
        isClose: false,
        tableAttrs: parsedOpen.attrs,
        length: parsedOpen.length,
      };
    }
  }

  if (tableClose >= 0) {
    const parsedClose = parseTableCloseTag(content, tableClose);
    if (parsedClose && (!next || tableClose < next.index)) {
      next = {
        index: tableClose,
        kind: "table",
        isClose: true,
        tableAttrs: getEmptyTableWrapperAttrs(),
        length: parsedClose.length,
      };
    }
  }

  return next;
}

type MarkupFrame =
  | { kind: "center" }
  | { kind: "table" };

export function hasPassageFormatMarkers(content: string | null | undefined) {
  if (!content) {
    return false;
  }

  return (
    content.includes(CENTER_OPEN) ||
    content.includes(CENTER_CLOSE) ||
    hasTableWrapperMarkers(content)
  );
}

export function isValidPassageBlockMarkup(content: string) {
  const stack: MarkupFrame[] = [];
  let index = 0;

  while (index < content.length) {
    const marker = findNextBlockMarker(content, index);
    if (!marker) {
      break;
    }

    if (marker.kind === "center") {
      if (marker.isClose) {
        const frame = stack.pop();
        if (!frame || frame.kind !== "center") {
          return false;
        }
      } else if (stack.length > 0) {
        return false;
      } else {
        stack.push({ kind: "center" });
      }

      index =
        marker.index + (marker.isClose ? CENTER_CLOSE.length : CENTER_OPEN.length);
      continue;
    }

    if (marker.isClose) {
      const frame = stack.pop();
      if (!frame || frame.kind !== "table") {
        return false;
      }
    } else if (stack.length > 0 && stack[stack.length - 1]?.kind !== "center") {
      return false;
    } else {
      stack.push({ kind: "table" });
    }

    index = marker.index + marker.length;
  }

  return stack.length === 0;
}

function trimBoundaryNewlines(blocks: RawPassageBlock[]): RawPassageBlock[] {
  return blocks.map((block, index) => {
    if (block.type !== "plain" || index === 0) {
      return block;
    }

    const previousBlock = blocks[index - 1];
    if (previousBlock?.type === "plain" || !block.raw.startsWith("\n")) {
      return block;
    }

    return {
      ...block,
      raw: block.raw.slice(1),
    };
  });
}

function trimBlockContent(raw: string) {
  return raw.replace(/^\s+/, "").replace(/\s+$/, "");
}

function parseRawPassageBlocks(
  content: string,
  options: ParseRawBlocksOptions,
): RawPassageBlock[] | null {
  const blocks: RawPassageBlock[] = [];
  let plainStart = 0;
  let index = 0;

  while (index < content.length) {
    const marker = findNextBlockMarker(content, index);
    if (!marker || marker.isClose) {
      break;
    }

    if (marker.kind === "center" && !options.allowCenter) {
      break;
    }

    if (marker.index > plainStart) {
      blocks.push({
        type: "plain",
        raw: content.slice(plainStart, marker.index),
      });
    }

    if (marker.kind === "center") {
      const closeIndex = content.indexOf(CENTER_CLOSE, marker.index + CENTER_OPEN.length);
      if (closeIndex === -1) {
        return null;
      }

      const inner = trimBlockContent(
        content.slice(marker.index + CENTER_OPEN.length, closeIndex),
      );
      const children = parseRawPassageBlocks(inner, { allowCenter: false });
      if (!children) {
        return null;
      }

      blocks.push({
        type: "center",
        children,
      });

      index = closeIndex + CENTER_CLOSE.length;
      plainStart = index;
      continue;
    }

    const closeIndex = findTableCloseIndex(
      content,
      marker.index + marker.length,
    );
    if (closeIndex === -1) {
      return null;
    }

    const closeTag = parseTableCloseTag(content, closeIndex);
    if (!closeTag) {
      return null;
    }

    blocks.push({
      type: "table",
      raw: trimBlockContent(content.slice(marker.index + marker.length, closeIndex)),
      tableAttrs: marker.tableAttrs,
    });

    index = closeIndex + closeTag.length;
    plainStart = index;
  }

  if (plainStart < content.length) {
    blocks.push({
      type: "plain",
      raw: content.slice(plainStart),
    });
  }

  return trimBoundaryNewlines(blocks);
}

export function parsePassageBlocks(content: string): RawPassageBlock[] | null {
  if (!isValidPassageBlockMarkup(content)) {
    return null;
  }

  return parseRawPassageBlocks(content, { allowCenter: true });
}

export type { PassageBlock };
