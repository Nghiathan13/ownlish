"use client";

import { useEffect, useRef } from "react";
import { classNames } from "@/shared/lib/classNames";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { RemoveIcon } from "@/shared/ui/icons/RemoveIcon";

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
    <label className="relative flex size-4 shrink-0 cursor-pointer items-center justify-center">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        aria-label={label}
        className="peer sr-only"
        onChange={onChange}
      />
      <span
        aria-hidden
        className={classNames(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          checked || indeterminate
            ? "border-foreground bg-foreground"
            : "border-border bg-muted hover:border-foreground",
        )}
      >
        {checked ? (
          <CheckIcon className="block size-3.5 shrink-0 text-background" />
        ) : indeterminate ? (
          <RemoveIcon className="block size-3.5 shrink-0 text-background" />
        ) : (
          <span className="block size-3.5 shrink-0" aria-hidden />
        )}
      </span>
    </label>
  );
}
