import {
  collectionCategoryTabs,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";

type CollectionCategoryTabsProps = {
  activeCategory: CollectionCategory;
  onCategoryChange: (category: CollectionCategory) => void;
};

export function CollectionCategoryTabs({
  activeCategory,
  onCategoryChange,
}: CollectionCategoryTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 px-4">
      {collectionCategoryTabs.map((tab) => (
        <button
          className={
            activeCategory === tab.key
              ? primaryTextButtonClassName()
              : secondaryTextButtonClassName()
          }
          key={tab.key}
          onClick={() => {
            onCategoryChange(tab.key);
          }}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
