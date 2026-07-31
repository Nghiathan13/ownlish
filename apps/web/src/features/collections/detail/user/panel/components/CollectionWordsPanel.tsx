"use client";

import { CollectionWordsPanelBody } from "@/features/collections/detail/user/panel/components/CollectionWordsPanelBody";
import { useCollectionWordsPanel } from "@/features/collections/detail/user/panel/hooks/useCollectionWordsPanel";

type CollectionWordsPanelProps = {
  collectionId: string;
  collectionName: string | null;
};

export function CollectionWordsPanel({ collectionId, collectionName }: CollectionWordsPanelProps) {
  const panel = useCollectionWordsPanel({ collectionId });

  return <CollectionWordsPanelBody {...panel} collectionName={collectionName} />;
}
