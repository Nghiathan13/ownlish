"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

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

export function ImportTargetCollectionSelect({
  ariaLabel = "Import into",
  collections,
  onChange,
  value,
  variant = "form",
}: ImportTargetCollectionSelectProps) {
  const options = collections.map((collection) => ({
    label: getCollectionLabel(collection),
    value: collection.id,
  }));

  if (variant === "review") {
    return (
      <SelectDropdown
        ariaLabel={ariaLabel}
        className="w-full max-w-72"
        onChange={onChange}
        options={options}
        value={value}
      />
    );
  }

  if (variant === "toolbar") {
    return (
      <SelectDropdown
        ariaLabel={ariaLabel}
        className="w-fit min-w-[10rem] max-w-[14rem]"
        onChange={onChange}
        options={options}
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
