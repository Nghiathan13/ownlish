"use client";

import { useRouter } from "next/navigation";
import {
  findCollectionById,
  getCollectionPath,
  getUserOwnedCollections,
} from "@/entities/collection/lib/collectionDisplay";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import { ImportTargetCollectionSelect } from "@/features/collections/shared/components/ImportTargetCollectionSelect";

type UserCollectionSwitcherProps = {
  collectionId: string;
};

export function UserCollectionSwitcher({
  collectionId,
}: UserCollectionSwitcherProps) {
  const router = useRouter();
  const { status, user } = useAuthSession();
  const userId = user?.id ?? null;
  const isAuthenticated = isAuthenticatedStatus(status);
  const { collections, hasCollectionsList } = useCollectionsListQuery({
    isAuthenticated,
    userId,
  });
  const userOwnedCollections = getUserOwnedCollections(collections);
  const currentCollection = findCollectionById(collections, collectionId);
  const showSwitcher =
    hasCollectionsList &&
    currentCollection?.kind === "USER" &&
    userOwnedCollections.length > 0;

  if (!showSwitcher) {
    return null;
  }

  return (
    <ImportTargetCollectionSelect
      ariaLabel="Collection"
      collections={userOwnedCollections}
      onChange={(nextCollectionId) => {
        if (nextCollectionId === collectionId) {
          return;
        }

        const nextCollection = userOwnedCollections.find(
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
