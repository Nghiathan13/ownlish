"use client";

import { BackToCollectionsLink } from "@/features/collections/detail/page/components/BackToCollectionsLink";
import { SystemCollectionSwitcher } from "@/features/collections/detail/page/components/SystemCollectionSwitcher";
import { UserCollectionSwitcher } from "@/features/collections/detail/page/components/UserCollectionSwitcher";

type CollectionDetailHeaderProps = {
  collectionId: string;
};

export function CollectionDetailHeader({
  collectionId,
}: CollectionDetailHeaderProps) {
  return (
    <div className="my-4 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
      <BackToCollectionsLink collectionId={collectionId} />
      <UserCollectionSwitcher collectionId={collectionId} />
      <SystemCollectionSwitcher collectionId={collectionId} />
    </div>
  );
}
