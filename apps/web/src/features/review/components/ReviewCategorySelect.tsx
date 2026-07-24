"use client";

import { useRouter } from "next/navigation";
import {
  collectionCategoryTabs,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

type ReviewCategorySelectProps = {
  activeCategory: CollectionCategory;
};

function getReviewCategoryPath(category: CollectionCategory) {
  return category === "oxford" ? "/review/oxford/A1/part-1" : "/review";
}

export function ReviewCategorySelect({ activeCategory }: ReviewCategorySelectProps) {
  const router = useRouter();

  return (
    <SelectDropdown
      ariaLabel="Review category"
      className="w-[200px]"
      onChange={(category) => {
        const path = getReviewCategoryPath(category);

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
