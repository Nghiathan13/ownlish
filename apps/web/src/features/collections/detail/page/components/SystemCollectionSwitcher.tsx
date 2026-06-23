"use client";

import { useRouter } from "next/navigation";
import {
  findCollectionById,
  getCollectionPath,
  getSystemCollectionsInSameCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsList } from "@/features/collections/shared/hooks/useCollections";
import { ImportTargetCollectionSelect } from "@/features/collections/shared/components/ImportTargetCollectionSelect";

type SystemCollectionSwitcherProps = {
  collectionId: string;
};

export function SystemCollectionSwitcher({
  collectionId,
}: SystemCollectionSwitcherProps) {
  const router = useRouter();
  const { status, user } = useAuthSession();
  const userId = user?.id ?? null;
  const isAuthenticated = isAuthenticatedStatus(status);
  const { collections, hasCollectionsList } = useCollectionsList({
    isAuthenticated,
    userId,
  });
  const currentCollection = findCollectionById(collections, collectionId);
  const systemCollections =
    currentCollection == null
      ? []
      : getSystemCollectionsInSameCategory(collections, currentCollection);
  const showSwitcher =
    hasCollectionsList &&
    currentCollection?.kind === "SYSTEM" &&
    systemCollections.length > 0;

  if (!showSwitcher) {
    return null;
  }

  return (
    <ImportTargetCollectionSelect
      ariaLabel="System collection"
      collections={systemCollections}
      onChange={(nextCollectionId) => {
        if (nextCollectionId === collectionId) {
          return;
        }

        const nextCollection = systemCollections.find(
          (collection) => collection.id === nextCollectionId,
        );

        if (!nextCollection) {
          return;
        }

        router.push(getCollectionPath(nextCollection));
      }}
      value={collectionId}
      variant="toolbar"
    />
  );
}
