import Link from "next/link";
import {
  collectionCategoryTabs,
  getCollectionsListPath,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type CollectionCategoryTabsProps = {
  activeCategory: CollectionCategory;
};

export function CollectionCategoryTabs({
  activeCategory,
}: CollectionCategoryTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 px-4">
      {collectionCategoryTabs.map((tab) => (
        <Link
          aria-current={activeCategory === tab.key ? "page" : undefined}
          className={
            activeCategory === tab.key
              ? primaryTextButtonClassName()
              : secondaryTextButtonClassName()
          }
          href={getCollectionsListPath(tab.key)}
          key={tab.key}
          scroll={false}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
