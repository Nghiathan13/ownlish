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
  menuAlign?: "left" | "right";
  menuClassName?: string;
  menuOrientation?: "horizontal" | "vertical";
  menuPlacement?: "bottom" | "top";
  onChange: (value: T) => void;
  optionClassName?: string;
  options: SelectDropdownOption<T>[];
  triggerClassName?: string;
  value: T;
};

export function SelectDropdown<T extends string | number>({
  ariaLabel,
  className,
  hideIcon = false,
  menuAlign = "right",
  menuClassName,
  menuOrientation = "vertical",
  menuPlacement = "bottom",
  onChange,
  optionClassName,
  options,
  triggerClassName,
  value,
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? "Select option";
  const isHorizontal = menuOrientation === "horizontal";

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

  const optionButtons = options.map((option) => {
    const isSelected = option.value === value;

    return (
      <button
        aria-selected={isSelected}
        className={classNames(
          "flex cursor-pointer items-center text-left text-foreground",
          isHorizontal
            ? "shrink-0 justify-center"
            : "w-full rounded-lg px-3 py-2 text-sm",
          isSelected
            ? "bg-[#f0f0f0] hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]"
            : "hover:bg-hover-overlay",
          optionClassName,
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
  });

  return (
    <div className={classNames("relative", className)} ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel}: ${selectedLabel}`}
        className={classNames(
          "flex h-10 w-full cursor-pointer items-center rounded-lg border border-border bg-surface text-left text-sm font-medium text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-[#000000]",
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
            "absolute z-20 rounded-lg border border-border bg-surface p-1 dark:bg-[#000000]",
            menuAlign === "left" ? "left-0" : "right-0",
            isHorizontal ? "flex w-max flex-row gap-1" : "min-w-full w-max",
            menuPlacement === "top"
              ? "bottom-[calc(100%+0.5rem)]"
              : "top-[calc(100%+0.5rem)]",
            menuClassName,
          )}
          id={menuId}
          role="listbox"
        >
          {isHorizontal ? (
            optionButtons
          ) : (
            <OverlayScrollArea
              centerSelector='[aria-selected="true"]'
              className="max-h-[calc(5*2.25rem+4*0.25rem)]"
              contentClassName="grid gap-1"
            >
              {optionButtons}
            </OverlayScrollArea>
          )}
        </div>
      ) : null}
    </div>
  );
}
