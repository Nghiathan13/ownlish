"use client";

import { CollectionWordsPanelBody } from "@/features/collections/detail/user/panel/components/CollectionWordsPanelBody";
import { useCollectionWordsPanel } from "@/features/collections/detail/user/panel/hooks/useCollectionWordsPanel";

type CollectionWordsPanelProps = {
  collectionId: string;
};

export function CollectionWordsPanel({ collectionId }: CollectionWordsPanelProps) {
  const panel = useCollectionWordsPanel({ collectionId });

  return <CollectionWordsPanelBody {...panel} />;
}
