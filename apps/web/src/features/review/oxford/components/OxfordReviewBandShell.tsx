"use client";

import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { OxfordBandTabs } from "@/features/collections/oxford/components/OxfordBandTabs";
import {
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { useOxfordCollectionMetaQuery } from "@/features/collections/oxford/model/useOxfordCollectionMetaQuery";
import {
  ReviewCategorySelect,
  ReviewModeToggle,
  ReviewWorkspace,
  ReviewWorkspaceRow,
} from "@/features/review/components";
import { useReviewMode } from "@/features/review/hooks/useReviewMode";
import { OxfordPartReviewNavigation } from "./OxfordPartReviewNavigation";
import { OxfordPartReviewSession } from "./OxfordPartReviewSession";
import {
  getOxfordReviewPath,
  useOxfordReviewNavigation,
} from "../model/useOxfordReviewNavigation";

type OxfordReviewBandShellProps = {
  bandParam: string;
  onCategoryChange: (category: "user" | "oxford") => void;
  partParam: string;
};

function getOxfordReviewBandPath(band: OxfordBand) {
  return getOxfordReviewPath(band, 1);
}

export function OxfordReviewBandShell({
  bandParam,
  onCategoryChange,
  partParam,
}: OxfordReviewBandShellProps) {
  const { status, user } = useAuthSession();
  const { mode, setMode } = useReviewMode();
  const isAuthenticated = isAuthenticatedStatus(status);
  const navigation = useOxfordReviewNavigation({
    bandParam,
    isAuthenticated,
    partParam,
    userId: user?.id ?? null,
  });
  const metaQuery = useOxfordCollectionMetaQuery({
    band: navigation.band,
    isAuthenticated,
  });

  return (
    <ReviewWorkspace
      header={
        <>
          <ReviewCategorySelect
            activeCategory="oxford"
            onCategoryChange={onCategoryChange}
          />
          <OxfordBandTabs
            activeBand={navigation.band}
            getHref={getOxfordReviewBandPath}
            onSelectBand={navigation.navigateBand}
          />
        </>
      }
    >
      <ReviewWorkspaceRow
        navigation={
          <OxfordPartReviewNavigation
            activeBand={navigation.band}
            activePart={navigation.part}
            itemCount={metaQuery.meta?.itemCount ?? null}
            loading={metaQuery.isLoading}
            onSelectPart={navigation.navigatePart}
          />
        }
        rail={
          <ReviewModeToggle
            mode={mode}
            onModeChange={setMode}
            orientation="vertical"
          />
        }
      >
        <OxfordPartReviewSession
          band={navigation.band}
          part={navigation.part}
        />
      </ReviewWorkspaceRow>
    </ReviewWorkspace>
  );
}
