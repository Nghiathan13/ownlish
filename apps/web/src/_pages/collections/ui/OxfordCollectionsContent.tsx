"use client";

import {
  isAuthenticatedStatus,
  useAuthSession,
} from "@/entities/session";
import {
  CollectionsGridSkeleton,
  CollectionsRetryPanel,
  useOxfordCollectionMetaQuery,
  useOxfordNavigation,
} from "@/features/collections";
import { OxfordGroupWordsPanel } from "./oxford/OxfordGroupWordsPanel";
import { OxfordWordGroupGrid } from "./oxford/OxfordWordGroupGrid";

type OxfordCollectionsContentProps = {
  bandParam: string | null;
  groupParam: string | null;
};

export function OxfordCollectionsContent({
  bandParam,
  groupParam,
}: OxfordCollectionsContentProps) {
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

  return (
    <OxfordWordGroupGrid
      band={navigation.band}
      itemCount={metaQuery.meta.itemCount}
      partProgress={metaQuery.meta.parts}
      onOpenPart={navigation.navigatePart}
    />
  );
}
