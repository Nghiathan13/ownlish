"use client";

import { useRouter } from "next/navigation";
import {
  collectionCategoryTabs,
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

type CollectionCategorySelectProps = {
  activeCategory: CollectionCategory;
  onCategoryChange?: (category: CollectionCategory) => void;
};

export function CollectionCategorySelect({
  activeCategory,
  onCategoryChange,
}: CollectionCategorySelectProps) {
  const router = useRouter();

  return (
    <SelectDropdown
      ariaLabel="Collection category"
      className="w-fit min-w-[10rem] max-w-[14rem]"
      onChange={(category) => {
        const path = getCollectionsListPath(category);

        onCategoryChange?.(category);

        if (window.location.pathname !== path) {
          window.history.pushState(null, "", path);
        }

        router.push(path);
      }}
      options={collectionCategoryTabs.map((category) => ({
        label: category.label,
        value: category.key,
      }))}
      value={activeCategory}
    />
  );
}
