"use client";

import { CollectionDetailBody } from "./CollectionDetailBody";
import { useCollectionDetailPage } from "./useCollectionDetailPage";

type CollectionDetailContentProps = {
  collectionId: string;
};

export function CollectionDetailContent({
  collectionId,
}: CollectionDetailContentProps) {
  const page = useCollectionDetailPage({ collectionId });

  return <CollectionDetailBody {...page} />;
}
