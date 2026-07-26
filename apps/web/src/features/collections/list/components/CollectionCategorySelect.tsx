"use client";

import { useRouter } from "next/navigation";
import {
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { CollectionCategoryTabs } from "@/features/collections/shared/components/CollectionCategoryTabs";
import { useT } from "@/shared/providers/LocaleProvider";

type CollectionCategorySelectProps = {
  activeCategory: CollectionCategory;
  onCategoryChange?: (category: CollectionCategory) => void;
};

export function CollectionCategorySelect({
  activeCategory,
  onCategoryChange,
}: CollectionCategorySelectProps) {
  const t = useT();
  const router = useRouter();

  return (
    <CollectionCategoryTabs
      activeCategory={activeCategory}
      ariaLabel={t("collections.categoryAria")}
      onCategoryChange={(category) => {
        const path = getCollectionsListPath(category);

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
