import { normalizeDictionaryLookup } from "@/entities/dictionary";

export type DictionarySelection = {
  range: Range;
  word: string;
};

export function getDictionarySelectionInsideRoot(
  rootElement: HTMLElement,
): DictionarySelection | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount !== 1 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!rootElement.contains(range.commonAncestorContainer)) {
    return null;
  }

  const word = normalizeDictionaryLookup(selection.toString());
  if (!word) {
    return null;
  }

  return {
    range: range.cloneRange(),
    word,
  };
}
