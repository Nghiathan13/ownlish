"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { classNames } from "@/shared/lib/classNames";
import {
  secondaryTextButtonColorsClassName,
  textButtonLayoutClassName,
} from "@/shared/ui/button";

type ImportTargetCollectionSelectProps = {
  ariaLabel?: string;
  collections: CollectionSummary[];
  onChange: (collectionId: string) => void;
  value: string;
  variant?: "form" | "review" | "toolbar";
};

const toolbarSelectClassName = classNames(
  textButtonLayoutClassName,
  secondaryTextButtonColorsClassName,
  "w-fit min-w-[10rem] max-w-[14rem] truncate appearance-none cursor-pointer",
);

const reviewSelectClassName = classNames(
  "h-10 w-full min-w-0 cursor-pointer appearance-none rounded-full border border-border bg-background py-0 pl-4 pr-10 text-sm font-medium text-foreground outline-none",
  "focus:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
);

export function ImportTargetCollectionSelect({
  ariaLabel = "Import into",
  collections,
  onChange,
  value,
  variant = "form",
}: ImportTargetCollectionSelectProps) {
  if (variant === "review") {
    return (
      <div className="relative w-full max-w-72">
        <select
          aria-label={ariaLabel}
          className={reviewSelectClassName}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.isDefault ? "My Vocabulary" : collection.name}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
        >
          ▾
        </span>
      </div>
    );
  }

  if (variant === "toolbar") {
    return (
      <select
        aria-label={ariaLabel}
        className={toolbarSelectClassName}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.isDefault ? "My Vocabulary" : collection.name}
          </option>
        ))}
      </select>
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
