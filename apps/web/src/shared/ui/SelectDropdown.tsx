"use client";

import { useEffect, useId, useRef, useState } from "react";
import { classNames } from "@/shared/lib/classNames";
import { ArrowDropDownIcon } from "@/shared/ui/icons/ArrowDropDownIcon";
import { ArrowDropUpIcon } from "@/shared/ui/icons/ArrowDropUpIcon";

export type SelectDropdownOption<T extends string> = {
  label: string;
  value: T;
};

type SelectDropdownProps<T extends string> = {
  ariaLabel: string;
  className: string;
  onChange: (value: T) => void;
  options: SelectDropdownOption<T>[];
  value: T;
};

export function SelectDropdown<T extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  value,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Select option";

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
    <div className={classNames("relative", className)} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel}: ${selectedLabel}`}
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-surface bg-surface px-4 text-left text-sm font-medium text-foreground shadow-card hover:border-[var(--hover-on-surface)] hover:bg-[var(--hover-on-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-border dark:hover:border-border dark:hover:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selectedLabel}</span>
        {isOpen ? (
          <ArrowDropUpIcon className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ArrowDropDownIcon className="size-5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen ? (
        <div
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 grid max-h-[calc(0.5rem+5*2.25rem+4*0.25rem)] w-full gap-1 overflow-y-auto rounded-lg border-0 bg-surface p-1 shadow-card dark:border dark:border-border"
          id={menuId}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                aria-selected={isSelected}
                className={classNames(
                  "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-hover-overlay",
                  isSelected && "bg-muted",
                )}
                key={option.value}
                onClick={() => {
                  setIsOpen(false);
                  onChange(option.value);
                }}
                role="option"
                type="button"
              >
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
