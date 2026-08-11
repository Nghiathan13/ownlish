"use client";

import { useState, type MouseEvent } from "react";

export function useWordRowHover() {
  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null);

  function onWordRowMouseEnter(wordId: string) {
    setHoveredWordId(wordId);
  }

  function onWordRowMouseLeave(
    event: MouseEvent<HTMLTableRowElement>,
    wordId: string,
  ) {
    const related = event.relatedTarget;

    if (related instanceof Element) {
      const relatedRow = related.closest("tr[data-word-id]");

      if (relatedRow?.getAttribute("data-word-id") === wordId) {
        return;
      }
    }

    setHoveredWordId((current) => (current === wordId ? null : current));
  }

  return {
    hoveredWordId,
    onWordRowMouseEnter,
    onWordRowMouseLeave,
  };
}
