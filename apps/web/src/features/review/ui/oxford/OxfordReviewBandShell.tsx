"use client";

import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { type OxfordBand } from "@/entities/collection";
import {
  OxfordBandTabs,
  useOxfordCollectionMetaQuery,
} from "@/features/collections/@x/review";
import {
  getOxfordReviewPath,
  useOxfordReviewNavigation,
} from "../../model/useOxfordReviewNavigation";
import { ReviewWorkspace, ReviewWorkspaceRow } from "../ReviewWorkspace";
import { OxfordPartReviewNavigation } from "./OxfordPartReviewNavigation";
import { OxfordPartReviewSession } from "./OxfordPartReviewSession";

type OxfordReviewBandShellProps = {
  bandParam: string;
  partParam: string;
};

function getOxfordReviewBandPath(band: OxfordBand) {
  return getOxfordReviewPath(band, 1);
}

export function OxfordReviewBandShell({
  bandParam,
  partParam,
}: OxfordReviewBandShellProps) {
  const { status, user } = useAuthSession();
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
    userId: user?.id ?? null,
  });

  return (
    <ReviewWorkspace
      header={
        <OxfordBandTabs
          activeBand={navigation.band}
          getHref={getOxfordReviewBandPath}
          onSelectBand={navigation.navigateBand}
        />
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
      >
        <OxfordPartReviewSession
          band={navigation.band}
          part={navigation.part}
        />
      </ReviewWorkspaceRow>
    </ReviewWorkspace>
  );
}
