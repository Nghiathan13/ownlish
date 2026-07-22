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
};

export function CollectionCategorySelect({
  activeCategory,
}: CollectionCategorySelectProps) {
  const router = useRouter();

  return (
    <SelectDropdown
      ariaLabel="Collection category"
      className="w-fit min-w-[10rem] max-w-[14rem]"
      onChange={(category) => {
        router.push(getCollectionsListPath(category));
      }}
      options={collectionCategoryTabs.map((category) => ({
        label: category.label,
        value: category.key,
      }))}
      value={activeCategory}
    />
  );
}
