"use client";

import type { CollectionCategory } from "@/entities/collection";
import {
  collectionCategoryTabs,
  getCollectionsListPath,
} from "@/entities/collection";
import { useT } from "@/shared/lib/providers";
import { PageHeaderTabs } from "@/shared/ui/page-header";

type CollectionCategoryTabsProps = {
  activeCategory: CollectionCategory;
  ariaLabel: string;
  onCategoryChange: (category: CollectionCategory) => void;
};

function getCategoryLabel(
  key: CollectionCategory,
  t: ReturnType<typeof useT>,
) {
  return key === "user" ? t("collections.myCollections") : t("collections.oxford");
}

export function CollectionCategoryTabs({
  activeCategory,
  ariaLabel,
  onCategoryChange,
}: CollectionCategoryTabsProps) {
  const t = useT();

  return (
    <PageHeaderTabs
      activeKey={activeCategory}
      ariaLabel={ariaLabel}
      items={collectionCategoryTabs.map((category) => ({
        href: getCollectionsListPath(category.key),
        key: category.key,
        label: getCategoryLabel(category.key, t),
      }))}
      onTabChange={onCategoryChange}
    />
  );
}
