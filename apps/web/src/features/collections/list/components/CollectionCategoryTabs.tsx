import Link from "next/link";
import {
  collectionCategoryTabs,
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { classNames } from "@/shared/lib/classNames";

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
};

export function CollectionCategoryTabs({
  activeCategory,
}: CollectionCategoryTabsProps) {
  return (
    <div className="m-8 w-fit min-w-[380px] gap-2 rounded-[16px] bg-surface p-2 shadow-card lg:m-16 lg:flex lg:flex-wrap">
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
  );
}
