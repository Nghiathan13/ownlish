"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useT } from "@/shared/providers/LocaleProvider";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { SwapColumnIcon } from "@/shared/ui/icons/SwapColumnIcon";

type ColumnOption<Id extends string> = {
  id: Id;
  label: string;
};

type WordsColumnPickerProps<Id extends string> = {
  columnVisibility: Record<Id, boolean>;
  columns: ReadonlyArray<ColumnOption<Id>>;
  onToggleColumn: (columnId: Id) => void;
};

export function WordsColumnPicker<Id extends string>({
  columnVisibility,
  columns,
  onToggleColumn,
}: WordsColumnPickerProps<Id>) {
  const t = useT();
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
          "w-fit shrink-0 border border-border bg-surface hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] dark:bg-[#000000]",
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        <SwapColumnIcon />
        {t("wordsTable.column")}
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("wordsTable.toggleColumns")}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 min-w-[12rem] rounded-lg border border-border bg-surface p-1 dark:bg-[#000000]"
        >
          {columns.map((column) => {
            const isVisible = columnVisibility[column.id];

            return (
              <button
                key={column.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isVisible}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover-overlay"
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
