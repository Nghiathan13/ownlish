export type TableWrapperAttrs = {
  bold: boolean;
  center: boolean;
  widthPercent: number | null;
};

const EMPTY_TABLE_ATTRS: TableWrapperAttrs = {
  bold: false,
  center: false,
  widthPercent: null,
};

function parseTableWrapperInner(inner: string): TableWrapperAttrs | null {
  const tokens = inner.trim().split(/\s+/).filter(Boolean);
  let center = false;
  let bold = false;
  let widthPercent: number | null = null;
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

    const widthMatch = /^w=(\d+)%$/.exec(token);
    if (widthMatch) {
      if (phase > 1 || widthPercent !== null) {
        return null;
      }

      const value = Number(widthMatch[1]);
      if (!Number.isInteger(value) || value <= 0 || value > 100) {
        return null;
      }

      widthPercent = value;
      phase = 2;
      continue;
    }

    if (token === "bold") {
      if (phase > 2 || bold) {
        return null;
      }

      bold = true;
      phase = 3;
      continue;
    }

    return null;
  }

  return { bold, center, widthPercent };
}

function parseTableTag(content: string, index: number, isClose: boolean) {
  const prefix = isClose ? "[/table" : "[table";
  if (!content.startsWith(prefix, index)) {
    return null;
  }

  const closeBracket = content.indexOf("]", index);
  if (closeBracket === -1) {
    return null;
  }

  const tag = content.slice(index, closeBracket + 1);
  if (!tag.startsWith(prefix) || !tag.endsWith("]")) {
    return null;
  }

  const inner = tag.slice(prefix.length, -1);
  const attrs = parseTableWrapperInner(inner);
  if (!attrs) {
    return null;
  }

  return {
    length: tag.length,
    attrs,
  };
}

export function findTableOpenIndex(content: string, fromIndex = 0) {
  return content.indexOf("[table", fromIndex);
}

export function findTableCloseIndex(content: string, fromIndex = 0) {
  return content.indexOf("[/table", fromIndex);
}

export function parseTableOpenTag(content: string, index: number) {
  const parsed = parseTableTag(content, index, false);
  if (!parsed) {
    return null;
  }

  return {
    length: parsed.length,
    attrs: parsed.attrs,
  };
}

export function parseTableCloseTagAttrs(content: string, index: number) {
  const parsed = parseTableTag(content, index, true);
  if (!parsed) {
    return null;
  }

  return {
    length: parsed.length,
    attrs: parsed.attrs,
  };
}

export function parseTableCloseTag(
  content: string,
  index: number,
  expected: TableWrapperAttrs,
) {
  const parsed = parseTableTag(content, index, true);
  if (!parsed) {
    return null;
  }

  if (!tableWrapperAttrsEqual(parsed.attrs, expected)) {
    return null;
  }

  return {
    length: parsed.length,
  };
}

export function tableWrapperAttrsEqual(
  left: TableWrapperAttrs,
  right: TableWrapperAttrs,
) {
  return (
    left.bold === right.bold &&
    left.center === right.center &&
    left.widthPercent === right.widthPercent
  );
}

export function hasTableWrapperMarkers(content: string) {
  return findTableOpenIndex(content) >= 0 || findTableCloseIndex(content) >= 0;
}

export function getEmptyTableWrapperAttrs(): TableWrapperAttrs {
  return EMPTY_TABLE_ATTRS;
}
