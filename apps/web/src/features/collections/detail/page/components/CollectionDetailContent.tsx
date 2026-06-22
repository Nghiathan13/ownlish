"use client";

import { CollectionDetailBody } from "@/features/collections/detail/page/components/CollectionDetailBody";
import { useCollectionDetailPage } from "@/features/collections/detail/page/hooks/useCollectionDetailPage";

type CollectionDetailContentProps = {
  collectionId: string;
};

export function CollectionDetailContent({
  collectionId,
}: CollectionDetailContentProps) {
  const page = useCollectionDetailPage({ collectionId });

  return <CollectionDetailBody {...page} />;
}
