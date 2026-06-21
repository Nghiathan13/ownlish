"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  VOCABULARY_TOGGLEABLE_COLUMNS,
  type VocabularyColumnVisibility,
  type VocabularyToggleableColumnId,
} from "@/features/vocabulary/lib/vocabularyTableColumns";
import { classNames } from "@/shared/lib/classNames";
import { iconTextButtonClassName } from "@/shared/ui/button/buttonTheme";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { SwapColumnIcon } from "@/shared/ui/icons/SwapColumnIcon";

type VocabularyColumnPickerProps = {
  columnVisibility: VocabularyColumnVisibility;
  onToggleColumn: (columnId: VocabularyToggleableColumnId) => void;
};

export function VocabularyColumnPicker({
  columnVisibility,
  onToggleColumn,
}: VocabularyColumnPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={iconTextButtonClassName(
          "w-fit shrink-0",
          "border-border bg-transparent text-foreground hover:bg-muted",
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        <SwapColumnIcon />
        Column
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Toggle table columns"
          className="absolute top-[calc(100%+0.25rem)] right-0 z-20 min-w-[12rem] rounded-md border border-border bg-background p-1 shadow-lg"
        >
          {VOCABULARY_TOGGLEABLE_COLUMNS.map((column) => {
            const isVisible = columnVisibility[column.id];

            return (
              <button
                key={column.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isVisible}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-muted"
                onClick={() => onToggleColumn(column.id)}
              >
                <span className="inline-flex size-4 shrink-0 items-center justify-center">
                  {isVisible ? <CheckIcon className="size-4" /> : null}
                </span>
                <span>{column.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
