"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import {
  collectionCategoryTabs,
  findCollectionById,
  getCollectionsListCategory,
  getCollectionsListPath,
  parseCollectionKindHint,
  type CollectionCategory,
} from "@/entities/collection/lib/collectionDisplay";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useCollectionsList } from "@/features/collections/shared/hooks/useCollections";
import { iconTextButtonClassName } from "@/shared/ui/button";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";

type BackToCollectionsLinkProps = {
  collectionId?: string;
};

function getBackCategory(
  collectionId: string | undefined,
  collections: CollectionSummary[],
  kindHint: ReturnType<typeof parseCollectionKindHint>,
): CollectionCategory {
  if (collectionId) {
    const collection = findCollectionById(collections, collectionId);

    if (collection) {
      return getCollectionsListCategory(collection);
    }
  }

  if (kindHint === "SYSTEM") {
    return "oxford";
  }

  return "user";
}

export function BackToCollectionsLink({
  collectionId,
}: BackToCollectionsLinkProps) {
  const searchParams = useSearchParams();
  const kindHint = parseCollectionKindHint(searchParams.get("kind"));
  const { status, user } = useAuthSession();
  const userId = user?.id ?? null;
  const isAuthenticated = isAuthenticatedStatus(status);
  const { collections } = useCollectionsList({
    isAuthenticated,
    userId,
  });
  const category = getBackCategory(collectionId, collections, kindHint);
  const href = getCollectionsListPath(category);
  const tabLabel =
    collectionCategoryTabs.find((tab) => tab.key === category)?.label ??
    "Collections";

  return (
    <Link
      aria-label={`Back to ${tabLabel}`}
      className={iconTextButtonClassName(
        "w-fit shrink-0",
        "border-foreground bg-foreground text-background",
      )}
      href={href}
    >
      <ArrowBackIcon />
      Back
    </Link>
  );
}
