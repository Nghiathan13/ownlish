"use client";

import type { CollectionCategory } from "@/entities/collection/lib/collectionDisplay";
import { collectionCategoryTabs } from "@/entities/collection/lib/collectionDisplay";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";

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
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -left-4 -right-4 z-0 h-[0.5px] bg-border lg:-left-16 lg:-right-16"
      />
      <div
        aria-label={ariaLabel}
        className="relative z-10 flex items-end gap-9 pl-3"
        role="tablist"
      >
        {collectionCategoryTabs.map((category) => {
          const isActive = activeCategory === category.key;
          const label = getCategoryLabel(category.key, t);

          return (
            <button
              aria-selected={isActive}
              className={classNames(
                "group/category-tab relative inline-flex cursor-pointer pb-3 text-base font-normal",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
              key={category.key}
              onClick={() => onCategoryChange(category.key)}
              role="tab"
              type="button"
            >
              {label}
              <span
                aria-hidden
                className={classNames(
                  "absolute -right-3 -left-3 bottom-[1px] h-[2.5px]",
                  isActive
                    ? "bg-foreground"
                    : "bg-transparent group-hover/category-tab:bg-border",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
