"use client";

import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CollectionWordsPanelBody } from "@/features/collections/detail/user/panel/components/CollectionWordsPanelBody";
import { useCollectionWordsPanel } from "@/features/collections/detail/user/panel/hooks/useCollectionWordsPanel";

type CollectionWordsPanelProps = {
  collectionId: string;
  hasCollectionsList: boolean;
  onCollectionChange: (collectionId: string) => void;
  userCollections: CollectionSummary[];
};

export function CollectionWordsPanel({
  collectionId,
  hasCollectionsList,
  onCollectionChange,
  userCollections,
}: CollectionWordsPanelProps) {
  const panel = useCollectionWordsPanel({ collectionId });

  return (
    <CollectionWordsPanelBody
      {...panel}
      collectionId={collectionId}
      hasCollectionsList={hasCollectionsList}
      onCollectionChange={onCollectionChange}
      userCollections={userCollections}
    />
  );
}
