"use client";

import { useEffect, useRef } from "react";
import { classNames } from "@/shared/lib/classNames";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";

type SelectCheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
};

export function SelectCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
}: SelectCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="inline-flex cursor-pointer items-center justify-center">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        aria-label={label}
        className="sr-only"
        onChange={onChange}
      />
      <span
        aria-hidden
        className={classNames(
          "flex size-4 items-center justify-center rounded border transition-colors duration-200",
          checked
            ? "border-foreground bg-foreground"
            : "border-border bg-muted hover:border-foreground",
        )}
      >
        {checked ? (
          <CheckIcon className="text-background" />
        ) : indeterminate ? (
          <span className="h-0.5 w-2.5 rounded-full bg-foreground" />
        ) : null}
      </span>
    </label>
  );
}
