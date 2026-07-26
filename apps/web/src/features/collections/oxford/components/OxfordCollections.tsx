"use client";

import type { CollectionCategory } from "@/entities/collection/lib/collectionDisplay";
import { CollectionsGridSkeleton } from "@/features/collections/list/components/CollectionsPageSkeleton";
import { CollectionCategorySelect } from "@/features/collections/list/components/CollectionCategorySelect";
import { CollectionsRetryPanel } from "@/features/collections/shared/components/CollectionsRetryPanel";
import { useOxfordCollectionMetaQuery } from "@/features/collections/oxford/model/useOxfordCollectionMetaQuery";
import { useOxfordNavigation } from "@/features/collections/oxford/model/useOxfordNavigation";
import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { OxfordBandTabs } from "./OxfordBandTabs";
import { OxfordGroupWordsPanel } from "./OxfordGroupWordsPanel";
import { OxfordWordGroupGrid } from "./OxfordWordGroupGrid";

type OxfordCollectionsProps = {
  bandParam: string | null;
  groupParam: string | null;
  onCategoryChange?: (category: CollectionCategory) => void;
};

export function OxfordCollections({
  bandParam,
  groupParam,
  onCategoryChange,
}: OxfordCollectionsProps) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const navigation = useOxfordNavigation({
    bandParam,
    groupParam,
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const metaQuery = useOxfordCollectionMetaQuery({
    band: navigation.band,
    enabled: navigation.group === null && !navigation.shouldResetPath,
    isAuthenticated,
    userId: user?.id ?? null,
  });

  if (navigation.shouldResetPath) {
    return <CollectionsGridSkeleton />;
  }

  if (navigation.group) {
    return (
      <OxfordGroupWordsPanel
        band={navigation.band}
        group={navigation.group}
        isAuthenticated={isAuthenticated}
        onBack={navigation.navigateOverview}
        userId={user?.id ?? null}
      />
    );
  }

  const overviewHeader = (
    <div className="my-3 flex flex-col gap-3 px-4 lg:gap-6 lg:my-6 lg:px-16">
      <CollectionCategorySelect
        activeCategory="oxford"
        onCategoryChange={onCategoryChange}
      />
      <OxfordBandTabs
        activeBand={navigation.band}
        onSelectBand={navigation.navigateBand}
      />
    </div>
  );

  if (metaQuery.isLoading) {
    return (
      <>
        {overviewHeader}
        <CollectionsGridSkeleton />
      </>
    );
  }

  if (metaQuery.error) {
    return (
      <>
        {overviewHeader}
        <CollectionsRetryPanel
          message={metaQuery.error}
          onRetry={metaQuery.reload}
        />
      </>
    );
  }

  if (!metaQuery.meta) {
    return (
      <>
        {overviewHeader}
        <CollectionsGridSkeleton />
      </>
    );
  }

  return (
    <>
      {overviewHeader}
      <OxfordWordGroupGrid
        band={navigation.band}
        itemCount={metaQuery.meta.itemCount}
        partProgress={metaQuery.meta.parts}
        onOpenPart={navigation.navigatePart}
      />
    </>
  );
}
