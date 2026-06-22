"use client";

import { useParams } from "next/navigation";
import { CollectionDetailPage } from "@/features/collections/components/CollectionDetailPage";

export default function CollectionDetailRoute() {
  const params = useParams<{ collectionId: string | string[] }>();
  const collectionId = Array.isArray(params.collectionId)
    ? params.collectionId[0]
    : params.collectionId;

  if (!collectionId) {
    return null;
  }

  return <CollectionDetailPage collectionId={collectionId} />;
}
