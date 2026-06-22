"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";

type ImportTargetCollectionSelectProps = {
  collections: CollectionSummary[];
  onChange: (collectionId: string) => void;
  value: string;
};

export function ImportTargetCollectionSelect({
  collections,
  onChange,
  value,
}: ImportTargetCollectionSelectProps) {
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
