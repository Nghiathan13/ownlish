import type {
  PassageTableCell,
  PassageTableRow,
} from "@/features/tests/run/lib/passageContent.types";
import { parsePassageInlines } from "@/features/tests/run/lib/parsePassageInlines";
import { hasTableWrapperMarkers } from "@/features/tests/run/lib/parsePassageTableWrapper";

const ROW_OPEN_PREFIX = "[row";
const ROW_CLOSE_PREFIX = "[/row";
const COL_OPEN_PREFIX = "[col";
const COL_CLOSE_PREFIX = "[/col";

export function hasPassageTableMarkers(content: string | null | undefined) {
  if (!content) {
    return false;
  }

  return (
    hasTableWrapperMarkers(content) ||
    content.includes(ROW_OPEN_PREFIX) ||
    content.includes(ROW_CLOSE_PREFIX) ||
    content.includes(COL_OPEN_PREFIX) ||
    content.includes(COL_CLOSE_PREFIX)
  );
}

function skipWhitespace(content: string, index: number) {
  let nextIndex = index;

  while (nextIndex < content.length && /\s/.test(content[nextIndex] ?? "")) {
    nextIndex += 1;
  }

  return nextIndex;
}

function trimCellContent(raw: string) {
  return raw.replace(/^\s+/, "").replace(/\s+$/, "");
}

function parseTagBody(inner: string) {
  const tokens = inner.trim().split(/\s+/).filter(Boolean);
  let widthPercent: number | null = null;
  let center = false;
  let border = false;

  for (const token of tokens) {
    const widthMatch = /^w=(\d+)%$/.exec(token);
    if (widthMatch) {
      const value = Number(widthMatch[1]);
      if (!Number.isInteger(value) || value <= 0 || value > 100) {
        return null;
      }

      widthPercent = value;
      continue;
    }

    if (token === "center") {
      center = true;
      continue;
    }

    if (token === "border") {
      border = true;
      continue;
    }

    return null;
  }

  return { border, widthPercent, center };
}

function parseRowWrapperInner(inner: string) {
  const tokens = inner.trim().split(/\s+/).filter(Boolean);
  let center = false;
  let bold = false;
  let border = false;
  let phase = 0;

  for (const token of tokens) {
    if (token === "center") {
      if (phase !== 0) {
        return null;
      }

      center = true;
      phase = 1;
      continue;
    }

    if (token === "bold") {
      if (phase > 1 || bold) {
        return null;
      }

      bold = true;
      phase = 2;
      continue;
    }

    if (token === "border") {
      if (phase > 2 || border) {
        return null;
      }

      border = true;
      phase = 3;
      continue;
    }

    return null;
  }

  return { border, center, bold };
}

function parseRowOpenTag(
  content: string,
  index: number,
): { length: number; border: boolean; center: boolean; bold: boolean } | null {
  if (!content.startsWith(ROW_OPEN_PREFIX, index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (!tag.startsWith("[row") || !tag.endsWith("]")) {
    return null;
  }

  const inner = tag.slice("[row".length, -1);
  if (inner.length === 0) {
    return { length: tag.length, border: false, center: false, bold: false };
  }

  const attrs = parseRowWrapperInner(inner);
  if (!attrs) {
    return null;
  }

  return { length: tag.length, ...attrs };
}

function parseRowCloseTag(
  content: string,
  index: number,
): { length: number } | null {
  if (!content.startsWith(ROW_CLOSE_PREFIX, index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (tag !== "[/row]") {
    return null;
  }

  return { length: tag.length };
}

function parseColOpenTag(
  content: string,
  index: number,
): { length: number; border: boolean; widthPercent: number | null; center: boolean } | null {
  if (!content.startsWith(COL_OPEN_PREFIX, index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (!tag.startsWith("[col") || !tag.endsWith("]")) {
    return null;
  }

  const inner = tag.slice("[col".length, -1);
  const parsedBody = parseTagBody(inner);
  if (!parsedBody) {
    return null;
  }

  return {
    length: tag.length,
    border: parsedBody.border,
    widthPercent: parsedBody.widthPercent,
    center: parsedBody.center,
  };
}

function parseColCloseTag(
  content: string,
  index: number,
): { length: number } | null {
  if (!content.startsWith(COL_CLOSE_PREFIX, index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (tag !== "[/col]") {
    return null;
  }

  return { length: tag.length };
}

function parseTableRow(
  content: string,
  startIndex: number,
): { row: PassageTableRow; nextIndex: number } | null {
  let index = skipWhitespace(content, startIndex);
  const rowOpen = parseRowOpenTag(content, index);
  if (!rowOpen) {
    return null;
  }

  index += rowOpen.length;
  const cols: PassageTableCell[] = [];
  let closedRow = false;

  while (index < content.length) {
    index = skipWhitespace(content, index);

    const rowClose = parseRowCloseTag(content, index);
    if (rowClose) {
      index += rowClose.length;
      closedRow = true;
      break;
    }

    const colOpen = parseColOpenTag(content, index);
    if (!colOpen) {
      return null;
    }

    index += colOpen.length;

    const colCloseIndex = content.indexOf("[/col]", index);
    if (colCloseIndex === -1) {
      return null;
    }

    const colClose = parseColCloseTag(content, colCloseIndex);
    if (!colClose) {
      return null;
    }

    const cellRaw = trimCellContent(content.slice(index, colCloseIndex));
    const inlines = parsePassageInlines(cellRaw);
    if (!inlines) {
      return null;
    }

    cols.push({
      border: colOpen.border,
      widthPercent: colOpen.widthPercent,
      center: colOpen.center,
      inlines,
    });
    index = colCloseIndex + colClose.length;
  }

  if (!closedRow || cols.length === 0) {
    return null;
  }

  const explicitWidthTotal = cols.reduce(
    (sum, col) => sum + (col.widthPercent ?? 0),
    0,
  );
  if (explicitWidthTotal > 100) {
    return null;
  }

  return {
    row: {
      bold: rowOpen.bold,
      border: rowOpen.border,
      center: rowOpen.center,
      cols,
    },
    nextIndex: index,
  };
}

export function parsePassageTable(
  content: string,
): { rows: PassageTableRow[] } | null {
  const rows: PassageTableRow[] = [];
  let index = skipWhitespace(content, 0);
  let expectedColCount: number | null = null;

  while (index < content.length) {
    const parsedRow = parseTableRow(content, index);
    if (!parsedRow) {
      return null;
    }

    const colCount = parsedRow.row.cols.length;
    if (expectedColCount === null) {
      expectedColCount = colCount;
    } else if (colCount !== expectedColCount) {
      return null;
    }

    rows.push(parsedRow.row);
    index = skipWhitespace(content, parsedRow.nextIndex);
  }

  if (rows.length === 0) {
    return null;
  }

  if (index < content.length) {
    return null;
  }

  return { rows };
}

export function getTableColumnStyle(
  col: PassageTableCell,
  cols: PassageTableCell[],
) {
  const explicitWidthTotal = cols.reduce(
    (sum, current) => sum + (current.widthPercent ?? 0),
    0,
  );
  const flexibleColCount = cols.filter((current) => current.widthPercent === null)
    .length;
  const remainingWidth = Math.max(0, 100 - explicitWidthTotal);
  const equalShare =
    flexibleColCount > 0 ? remainingWidth / flexibleColCount : 0;

  if (col.widthPercent !== null) {
    return {
      flexBasis: `${col.widthPercent}%`,
      flexGrow: 0,
    };
  }

  return {
    flexBasis: `${equalShare}%`,
    flexGrow: 1,
  };
}
