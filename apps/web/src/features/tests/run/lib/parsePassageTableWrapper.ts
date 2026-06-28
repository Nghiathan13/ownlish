import type { PassageTableModifier } from "@/features/tests/run/lib/passageContent.types";

export type TableWrapperModifier = PassageTableModifier | null;

const TABLE_OPEN_PATTERN = /^\[table(?:\s+(bold|center))?\]/;
const TABLE_CLOSE_PATTERN = /^\[\/table(?:\s+(bold|center))?\]/;

export function findTableOpenIndex(content: string, fromIndex = 0) {
  return content.indexOf("[table", fromIndex);
}

export function findTableCloseIndex(content: string, fromIndex = 0) {
  return content.indexOf("[/table", fromIndex);
}

export function parseTableOpenTag(content: string, index: number) {
  const match = TABLE_OPEN_PATTERN.exec(content.slice(index));
  if (!match) {
    return null;
  }

  return {
    length: match[0].length,
    modifier: (match[1] as PassageTableModifier | undefined) ?? null,
  };
}

export function parseTableCloseTag(
  content: string,
  index: number,
  expectedModifier: TableWrapperModifier,
) {
  const match = TABLE_CLOSE_PATTERN.exec(content.slice(index));
  if (!match) {
    return null;
  }

  const modifier = (match[1] as PassageTableModifier | undefined) ?? null;
  if (modifier !== expectedModifier) {
    return null;
  }

  return {
    length: match[0].length,
  };
}

export function hasTableWrapperMarkers(content: string) {
  return findTableOpenIndex(content) >= 0 || findTableCloseIndex(content) >= 0;
}
