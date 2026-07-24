"use client";

import { useEffect, useId, useRef, useState } from "react";
import { classNames } from "@/shared/lib/classNames";
import { ArrowDropDownIcon } from "@/shared/ui/icons/ArrowDropDownIcon";
import { ArrowDropUpIcon } from "@/shared/ui/icons/ArrowDropUpIcon";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";

export type SelectDropdownOption<T extends string | number> = {
  label: string;
  value: T;
};

type SelectDropdownProps<T extends string | number> = {
  ariaLabel: string;
  className: string;
  hideIcon?: boolean;
  menuPlacement?: "bottom" | "top";
  onChange: (value: T) => void;
  options: SelectDropdownOption<T>[];
  triggerClassName?: string;
  value: T;
};

export function SelectDropdown<T extends string | number>({
  ariaLabel,
  className,
  hideIcon = false,
  menuPlacement = "bottom",
  onChange,
  options,
  triggerClassName,
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
        className={classNames(
          "flex h-10 w-full cursor-pointer items-center rounded-lg border border-surface bg-surface text-left text-sm font-medium text-foreground shadow-card hover:border-[var(--hover-on-surface)] hover:bg-[var(--hover-on-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-border dark:hover:border-border dark:hover:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
          hideIcon ? "justify-center px-3" : "justify-between gap-3 px-4",
          triggerClassName,
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selectedLabel}</span>
        {hideIcon ? null : isOpen ? (
          <ArrowDropUpIcon className="size-5 shrink-0 text-muted-foreground" />
        ) : (
          <ArrowDropDownIcon className="size-5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isOpen ? (
        <div
          aria-label={ariaLabel}
          className={classNames(
            "absolute right-0 z-20 min-w-full w-max rounded-lg border-0 bg-surface p-1 shadow-card dark:border dark:border-border",
            menuPlacement === "top"
              ? "bottom-[calc(100%+0.5rem)]"
              : "top-[calc(100%+0.5rem)]",
          )}
          id={menuId}
          role="listbox"
        >
          <OverlayScrollArea
            centerSelector='[aria-selected="true"]'
            className="max-h-[calc(5*2.25rem+4*0.25rem)]"
            contentClassName="grid gap-1"
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
                  key={String(option.value)}
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
          </OverlayScrollArea>
        </div>
      ) : null}
    </div>
  );
}
