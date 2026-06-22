"use client";

import { BackToCollectionsLink } from "@/features/collections/detail/page/components/BackToCollectionsLink";
import { UserCollectionSwitcher } from "@/features/collections/detail/page/components/UserCollectionSwitcher";

type CollectionDetailHeaderProps = {
  collectionId: string;
};

export function CollectionDetailHeader({
  collectionId,
}: CollectionDetailHeaderProps) {
  return (
    <div className="mb-4 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
      <BackToCollectionsLink />
      <UserCollectionSwitcher collectionId={collectionId} />
    </div>
  );
}
