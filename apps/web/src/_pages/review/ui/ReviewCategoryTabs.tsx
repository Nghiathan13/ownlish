"use client";

import type { CollectionCategory } from "@/entities/collection";
import { CollectionCategoryTabs } from "@/features/collections";
import { useT } from "@/shared/lib/providers";

type ReviewCategoryTabsProps = {
  activeCategory: CollectionCategory;
  onCategoryChange: (category: CollectionCategory) => void;
};

export function ReviewCategoryTabs({
  activeCategory,
  onCategoryChange,
}: ReviewCategoryTabsProps) {
  const t = useT();

  return (
    <div className="mt-3 px-4 lg:mt-6 lg:px-16">
      <CollectionCategoryTabs
        activeCategory={activeCategory}
        ariaLabel={t("collections.categoryAria")}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}
