"use client";

import { useRouter } from "next/navigation";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { getCollectionPath } from "@/entities/collection/lib/collectionDisplay";
import { ImportTargetCollectionSelect } from "@/features/collections/shared/components/ImportTargetCollectionSelect";

type CollectionsQuickSwitcherProps = {
  collections: CollectionSummary[];
};

export function CollectionsQuickSwitcher({
  collections,
}: CollectionsQuickSwitcherProps) {
  const router = useRouter();

  if (collections.length === 0) {
    return null;
  }

  return (
    <ImportTargetCollectionSelect
      ariaLabel="Open collection"
      collections={collections}
      onChange={(collectionId) => {
        const collection = collections.find(
          (item) => item.id === collectionId,
        );

        if (collection) {
          router.push(getCollectionPath(collection));
        }
      }}
      value=""
      variant="toolbar"
    />
  );
}
