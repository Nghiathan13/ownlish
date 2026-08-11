"use client";

import { CollectionWordsPanelBody } from "@/_pages/collections/ui/vocabulary/CollectionWordsPanelBody";
import { useCollectionWordsPanel } from "@/_pages/collections/model/vocabulary/panel/useCollectionWordsPanel";

type CollectionWordsPanelProps = {
  collectionId: string;
  collectionName: string | null;
};

export function CollectionWordsPanel({ collectionId, collectionName }: CollectionWordsPanelProps) {
  const panel = useCollectionWordsPanel({ collectionId });

  return <CollectionWordsPanelBody {...panel} collectionName={collectionName} />;
}
