"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CollectionSummary } from "@/entities/collection/api/collections";
import { CollectionCategoryEmptyState } from "@/features/collections/list/components/CollectionCategoryEmptyState";
import { CollectionsGridSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import {
  getOxfordPath,
  OXFORD_GROUP_SIZE,
  parseOxfordBand,
  parseOxfordGroup,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { OxfordGroupWordsPanel } from "./OxfordGroupWordsPanel";
import { OxfordWordGroupGrid } from "./OxfordWordGroupGrid";

type OxfordCollectionsProps = {
  bandParam: string | null;
  collections: CollectionSummary[];
  error: string | null;
  groupParam: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onRetry: () => void;
  targetCollectionId: string | null;
  userId: string | null;
};

export function OxfordCollections({
  bandParam,
  collections,
  error,
  groupParam,
  isAuthenticated,
  isLoading,
  onRetry,
  targetCollectionId,
  userId,
}: OxfordCollectionsProps) {
  const router = useRouter();
  const band = parseOxfordBand(bandParam) ?? "A1";
  const group = parseOxfordGroup(groupParam);
  const collection = collections.find((item) => item.cefrLevel === band) ?? null;
  const groupCount = collection
    ? Math.ceil(collection.itemCount / OXFORD_GROUP_SIZE)
    : 0;
  const shouldResetPath =
    bandParam !== band ||
    (groupParam !== null && (group === null || group > groupCount));

  useEffect(() => {
    if (!isLoading && shouldResetPath) {
      router.replace(getOxfordPath(band), { scroll: false });
    }
  }, [band, isLoading, router, shouldResetPath]);

  if (isLoading || shouldResetPath) {
    return <CollectionsGridSkeleton />;
  }

  if (error) {
    return <CollectionsRetryPanel message={error} onRetry={onRetry} />;
  }

  if (!collection) {
    return <CollectionCategoryEmptyState categoryLabel={`Oxford ${band}`} />;
  }

  return (
    <>
      {group ? (
        <OxfordGroupWordsPanel
          band={band}
          collection={collection}
          group={group}
          isAuthenticated={isAuthenticated}
          targetCollectionId={targetCollectionId}
          userId={userId}
        />
      ) : (
        <OxfordWordGroupGrid band={band} collection={collection} />
      )}
    </>
  );
}
