"use client";

import { useRouter } from "next/navigation";
import {
  collectionCategoryTabs,
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { useT } from "@/shared/providers/LocaleProvider";
import { SelectDropdown } from "@/shared/ui/SelectDropdown";

type CollectionCategorySelectProps = {
  activeCategory: CollectionCategory;
  onCategoryChange?: (category: CollectionCategory) => void;
};

function getCategoryLabel(
  key: CollectionCategory,
  t: ReturnType<typeof useT>,
) {
  return key === "user" ? t("collections.myCollections") : t("collections.oxford");
}

export function CollectionCategorySelect({
  activeCategory,
  onCategoryChange,
}: CollectionCategorySelectProps) {
  const t = useT();
  const router = useRouter();

  return (
    <SelectDropdown
      ariaLabel={t("collections.categoryAria")}
      className="w-fit min-w-[10rem] max-w-[14rem]"
      onChange={(category) => {
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
      options={collectionCategoryTabs.map((category) => ({
        label: getCategoryLabel(category.key, t),
        value: category.key,
      }))}
      value={activeCategory}
    />
  );
}
