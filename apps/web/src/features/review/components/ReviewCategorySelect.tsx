"use client";

import { useRouter } from "next/navigation";
import type { CollectionCategory } from "@/entities/collection/lib/collectionDisplay";
import { CollectionCategoryTabs } from "@/features/collections/shared/components/CollectionCategoryTabs";
import { useT } from "@/shared/providers/LocaleProvider";

type ReviewCategorySelectProps = {
  activeCategory: CollectionCategory;
  onCategoryChange?: (category: CollectionCategory) => void;
};

function getReviewCategoryPath(category: CollectionCategory) {
  return category === "oxford" ? "/review/oxford/A1/part-1" : "/review";
}

export function ReviewCategorySelect({
  activeCategory,
  onCategoryChange,
}: ReviewCategorySelectProps) {
  const t = useT();
  const router = useRouter();

  return (
    <CollectionCategoryTabs
      activeCategory={activeCategory}
      ariaLabel={t("collections.categoryAria")}
      onCategoryChange={(category) => {
        const path = getReviewCategoryPath(category);

        if (onCategoryChange) {
          onCategoryChange(category);
          return;
        }

        if (window.location.pathname !== path) {
          window.history.pushState(null, "", path);
        }

        router.push(path, { scroll: false });
      }}
    />
  );
}
