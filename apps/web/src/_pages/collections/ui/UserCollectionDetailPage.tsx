"use client";

import { useParams } from "next/navigation";
import { CollectionDetailShell } from "./user-detail/CollectionDetailShell";

export function UserCollectionDetailPage() {
  const params = useParams<{ collectionId: string | string[] }>();
  const collectionId = Array.isArray(params.collectionId)
    ? params.collectionId[0]
    : params.collectionId;

  if (!collectionId) {
    return null;
  }

  return <CollectionDetailShell collectionId={collectionId} />;
}
