import Link from "next/link";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  collectionCategoryTabs,
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { classNames } from "@/shared/lib/classNames";
import { CollectionsQuickSwitcher } from "./CollectionsQuickSwitcher";

const categoryButtonClassName =
  "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-[15px] leading-[20px] font-normal";

function getCategoryButtonClassName(isActive: boolean) {
  return classNames(
    categoryButtonClassName,
    isActive
      ? "bg-foreground text-background"
      : "bg-transparent text-foreground hover:bg-hover-overlay",
  );
}

type CollectionCategoryTabsProps = {
  activeCategory: CollectionCategory;
  collections: CollectionSummary[];
};

export function CollectionCategoryTabs({
  activeCategory,
  collections,
}: CollectionCategoryTabsProps) {
  return (
    <div className="mt-8 mb-4 overflow-x-auto px-4 lg:mt-16 lg:px-16">
      <div className="flex min-w-max items-center gap-2">
        <CollectionsQuickSwitcher collections={collections} />
        <div className="flex min-w-[380px] gap-2 rounded-[16px] bg-surface p-2 shadow-card dark:border dark:border-border">
          {collectionCategoryTabs.map((tab) => {
            const isActive = activeCategory === tab.key;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={getCategoryButtonClassName(isActive)}
                href={getCollectionsListPath(tab.key)}
                key={tab.key}
                scroll={false}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
