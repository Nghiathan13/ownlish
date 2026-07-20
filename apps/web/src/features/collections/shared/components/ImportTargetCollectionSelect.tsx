"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { classNames } from "@/shared/lib/classNames";
import { ArrowDropDownIcon } from "@/shared/ui/icons/ArrowDropDownIcon";
import { ArrowDropUpIcon } from "@/shared/ui/icons/ArrowDropUpIcon";

type ImportTargetCollectionSelectProps = {
  ariaLabel?: string;
  collections: CollectionSummary[];
  onChange: (collectionId: string) => void;
  value: string;
  variant?: "form" | "review" | "toolbar";
};

function getCollectionLabel(collection: CollectionSummary) {
  return collection.isDefault ? "My Vocabulary" : collection.name;
}

function CollectionDropdown({
  ariaLabel,
  className,
  collections,
  onChange,
  value,
}: Omit<ImportTargetCollectionSelectProps, "variant"> & { className: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedCollection = collections.find((collection) => collection.id === value);
  const selectedLabel = selectedCollection
    ? getCollectionLabel(selectedCollection)
    : "Select collection";

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
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface px-4 text-left text-sm font-medium text-foreground shadow-card transition hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
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
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 grid w-full gap-1 rounded-lg border-0 bg-surface p-1 shadow-card dark:border dark:border-border"
          id={menuId}
          role="listbox"
        >
          {collections.map((collection) => {
            const isSelected = collection.id === value;

            return (
              <button
                aria-selected={isSelected}
                className={classNames(
                  "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-hover-overlay",
                  isSelected && "bg-muted",
                )}
                key={collection.id}
                onClick={() => {
                  setIsOpen(false);
                  onChange(collection.id);
                }}
                role="option"
                type="button"
              >
                <span className="truncate">{getCollectionLabel(collection)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function ImportTargetCollectionSelect({
  ariaLabel = "Import into",
  collections,
  onChange,
  value,
  variant = "form",
}: ImportTargetCollectionSelectProps) {
  if (variant === "review") {
    return (
      <CollectionDropdown
        ariaLabel={ariaLabel}
        className="w-full max-w-72"
        collections={collections}
        onChange={onChange}
        value={value}
      />
    );
  }

  if (variant === "toolbar") {
    return (
      <CollectionDropdown
        ariaLabel={ariaLabel}
        className="w-fit min-w-[10rem] max-w-[14rem]"
        collections={collections}
        onChange={onChange}
        value={value}
      />
    );
  }

  return (
    <div className="grid gap-2">
      <label
        className="text-sm font-semibold text-foreground"
        htmlFor="import-target-collection"
      >
        Import into
      </label>
      <select
        className="h-10 w-full max-w-md cursor-pointer appearance-none rounded-lg border border-border bg-transparent px-3 text-sm text-foreground outline-none transition hover:border-foreground focus:border-foreground"
        id="import-target-collection"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.isDefault ? "My Vocabulary" : collection.name}
          </option>
        ))}
      </select>
    </div>
  );
}
