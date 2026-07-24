"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { useT } from "@/shared/providers/LocaleProvider";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

type ImportTargetCollectionSelectProps = {
  ariaLabel?: string;
  collections: CollectionSummary[];
  onChange: (collectionId: string) => void;
  value: string;
  variant?: "form" | "review" | "toolbar";
};

export function ImportTargetCollectionSelect({
  ariaLabel,
  collections,
  onChange,
  value,
  variant = "form",
}: ImportTargetCollectionSelectProps) {
  const t = useT();
  const resolvedAriaLabel = ariaLabel ?? t("collections.importInto");
  const options = collections.map((collection) => ({
    label: collection.isDefault
      ? t("collections.myVocabulary")
      : collection.name,
    value: collection.id,
  }));

  if (variant === "review") {
    return (
      <SelectDropdown
        ariaLabel={resolvedAriaLabel}
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
        ariaLabel={resolvedAriaLabel}
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
        {t("collections.importInto")}
      </label>
      <select
        className="h-10 w-full max-w-md cursor-pointer appearance-none rounded-lg border border-border bg-transparent px-3 text-sm text-foreground outline-none transition hover:border-foreground focus:border-foreground"
        id="import-target-collection"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.isDefault
              ? t("collections.myVocabulary")
              : collection.name}
          </option>
        ))}
      </select>
    </div>
  );
}
