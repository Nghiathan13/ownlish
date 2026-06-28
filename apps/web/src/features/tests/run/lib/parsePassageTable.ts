import type {
  PassageTableCell,
  PassageTableRow,
} from "@/features/tests/run/lib/passageContent.types";
import { parsePassageInlines } from "@/features/tests/run/lib/parsePassageInlines";

const ROW_OPEN = "[row]";
const ROW_CLOSE = "[/row]";
const COL_CLOSE = "[/col]";
const COL_OPEN_PATTERN = /^\[col(?:\s+w=(\d+)%)?\]$/;

export function hasPassageTableMarkers(content: string | null | undefined) {
  if (!content) {
    return false;
  }

  return (
    content.includes("[table]") ||
    content.includes("[/table]") ||
    content.includes(ROW_OPEN) ||
    content.includes(ROW_CLOSE) ||
    content.includes("[col") ||
    content.includes(COL_CLOSE)
  );
}

function parseColOpenTag(
  content: string,
  index: number,
): { length: number; widthPercent: number | null } | null {
  if (!content.startsWith("[col", index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  const match = COL_OPEN_PATTERN.exec(tag);
  if (!match) {
    return null;
  }

  const widthPercent = match[1] ? Number(match[1]) : null;
  if (
    widthPercent !== null &&
    (!Number.isInteger(widthPercent) || widthPercent <= 0 || widthPercent > 100)
  ) {
    return null;
  }

  return {
    length: tag.length,
    widthPercent,
  };
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

function parseTableRow(
  content: string,
  startIndex: number,
): { row: PassageTableRow; nextIndex: number } | null {
  let index = skipWhitespace(content, startIndex);

  if (!content.startsWith(ROW_OPEN, index)) {
    return null;
  }

  index += ROW_OPEN.length;
  const cols: PassageTableCell[] = [];
  let closedRow = false;

  while (index < content.length) {
    index = skipWhitespace(content, index);

    if (content.startsWith(ROW_CLOSE, index)) {
      index += ROW_CLOSE.length;
      closedRow = true;
      break;
    }

    const colOpen = parseColOpenTag(content, index);
    if (!colOpen) {
      return null;
    }

    index += colOpen.length;

    const colCloseIndex = content.indexOf(COL_CLOSE, index);
    if (colCloseIndex === -1) {
      return null;
    }

    const raw = trimCellContent(content.slice(index, colCloseIndex));
    const inlines = parsePassageInlines(raw);
    if (!inlines) {
      return null;
    }

    cols.push({
      widthPercent: colOpen.widthPercent,
      inlines,
    });
    index = colCloseIndex + COL_CLOSE.length;
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
    row: { cols },
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
