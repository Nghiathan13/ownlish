"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CollectionsGridSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import {
  formatOxfordPartSegment,
  getOxfordPath,
  parseOxfordBand,
  parseOxfordGroup,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { useOxfordCollectionMetaQuery } from "@/features/collections/oxford/model/useOxfordCollectionMetaQuery";
import { OxfordGroupWordsPanel } from "./OxfordGroupWordsPanel";
import { OxfordWordGroupGrid } from "./OxfordWordGroupGrid";

type OxfordCollectionsProps = {
  bandParam: string | null;
  groupParam: string | null;
  isAuthenticated: boolean;
  userId: string | null;
};

export function OxfordCollections({
  bandParam,
  groupParam,
  isAuthenticated,
  userId,
}: OxfordCollectionsProps) {
  const router = useRouter();
  const band = parseOxfordBand(bandParam) ?? "A1";
  const group = parseOxfordGroup(groupParam);
  const isGroupSegmentCanonical =
    groupParam === null ||
    (group !== null && groupParam === formatOxfordPartSegment(group));
  const shouldResetPath =
    bandParam !== band ||
    (groupParam !== null && group === null) ||
    (group !== null && !isGroupSegmentCanonical);
  const metaQuery = useOxfordCollectionMetaQuery({
    band,
    enabled: group === null && !shouldResetPath,
    isAuthenticated,
    userId,
  });

  useEffect(() => {
    if (shouldResetPath) {
      router.replace(group === null ? getOxfordPath(band) : getOxfordPath(band, group), {
        scroll: false,
      });
    }
  }, [band, group, router, shouldResetPath]);

  if (shouldResetPath) {
    return <CollectionsGridSkeleton />;
  }

  if (group) {
    return (
      <OxfordGroupWordsPanel
        band={band}
        group={group}
        isAuthenticated={isAuthenticated}
        userId={userId}
      />
    );
  }

  if (metaQuery.isLoading) {
    return <CollectionsGridSkeleton />;
  }

  if (metaQuery.error) {
    return (
      <CollectionsRetryPanel
        message={metaQuery.error}
        onRetry={metaQuery.reload}
      />
    );
  }

  if (!metaQuery.meta) {
    return <CollectionsGridSkeleton />;
  }

  return <OxfordWordGroupGrid band={band} itemCount={metaQuery.meta.itemCount} />;
}
