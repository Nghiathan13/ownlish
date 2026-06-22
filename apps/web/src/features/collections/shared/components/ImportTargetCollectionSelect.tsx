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
  variant?: "form" | "toolbar";
};

const toolbarSelectClassName = classNames(
  textButtonLayoutClassName,
  secondaryTextButtonColorsClassName,
  "w-fit min-w-[10rem] max-w-[14rem] truncate appearance-none cursor-pointer",
  "[@media(prefers-color-scheme:dark)]:color-scheme-dark",
);

export function ImportTargetCollectionSelect({
  ariaLabel = "Import into",
  collections,
  onChange,
  value,
  variant = "form",
}: ImportTargetCollectionSelectProps) {
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
        className="h-10 w-full max-w-md cursor-pointer appearance-none rounded-lg border border-border bg-transparent px-3 text-sm text-foreground outline-none transition hover:border-foreground focus:border-foreground [@media(prefers-color-scheme:dark)]:color-scheme-dark"
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
