import type { CollectionSummary } from "@/entities/collection/api/collections";
import { ReviewSideNavigation } from "./ReviewSideNavigation";

type ReviewUserCollectionNavigationProps = {
  activeCollectionId: string | null;
  collections: CollectionSummary[];
  isLoading: boolean;
};

function getCollectionLabel(collection: CollectionSummary) {
  return collection.isDefault ? "My Vocabulary" : collection.name;
}

export function ReviewUserCollectionNavigation({
  activeCollectionId,
  collections,
  isLoading,
}: ReviewUserCollectionNavigationProps) {
  return (
    <ReviewSideNavigation
      ariaLabel="Review collections"
      emptyLabel="No collections"
      items={collections.map((collection) => ({
        id: collection.id,
        href: `/review?collectionId=${collection.id}`,
        isActive: collection.id === activeCollectionId,
        label: getCollectionLabel(collection),
      }))}
      loading={isLoading}
    />
  );
}
