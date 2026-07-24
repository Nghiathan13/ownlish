"use client";

import { useParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { isAuthenticatedStatus, useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { OxfordBandTabs } from "@/features/collections/oxford/components/OxfordBandTabs";
import {
  parseOxfordBand,
  parseOxfordGroup,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import { useOxfordCollectionMetaQuery } from "@/features/collections/oxford/model/useOxfordCollectionMetaQuery";
import {
  ReviewCategorySelect,
  ReviewModeToggle,
  ReviewWorkspace,
  ReviewWorkspaceRow,
} from "@/features/review/components";
import {
  ReviewModeProvider,
  useReviewMode,
} from "@/features/review/hooks/useReviewMode";
import { OxfordPartReviewNavigation } from "./OxfordPartReviewNavigation";
import { OxfordPartReviewSession } from "./OxfordPartReviewSession";
import { useOxfordReviewNavigation } from "../model/useOxfordReviewNavigation";

function getOxfordReviewBandPath(band: OxfordBand) {
  return `/review/oxford/${band}/part-1`;
}

export function OxfordReviewBandShell() {
  return (
    <RequireAuth>
      <ReviewModeProvider>
        <OxfordReviewBandShellContent />
      </ReviewModeProvider>
    </RequireAuth>
  );
}

function OxfordReviewBandShellContent() {
  const params = useParams();
  const bandParam = typeof params.band === "string" ? params.band : null;
  const partParam = typeof params.part === "string" ? params.part : null;
  const band = parseOxfordBand(bandParam);
  const activePart = parseOxfordGroup(partParam) ?? 1;
  const { status, user } = useAuthSession();
  const { mode, setMode } = useReviewMode();
  const isAuthenticated = isAuthenticatedStatus(status);
  const { navigateBand, navigatePart } = useOxfordReviewNavigation({
    activeBand: band ?? "A1",
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const metaQuery = useOxfordCollectionMetaQuery({
    // Fall back while the URL is briefly invalid; page-level notFound handles real misses.
    band: band ?? "A1",
    isAuthenticated,
    enabled: band != null,
  });

  if (!band) {
    return null;
  }

  return (
    <ReviewWorkspace
      header={
        <>
          <ReviewCategorySelect activeCategory="oxford" />
          <OxfordBandTabs
            activeBand={band}
            getHref={getOxfordReviewBandPath}
            onSelectBand={navigateBand}
          />
        </>
      }
    >
      <ReviewWorkspaceRow
        navigation={
          <OxfordPartReviewNavigation
            activeBand={band}
            activePart={activePart}
            itemCount={metaQuery.meta?.itemCount ?? null}
            loading={metaQuery.isLoading}
            onSelectPart={navigatePart}
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
        <OxfordPartReviewSession band={band} part={activePart} />
      </ReviewWorkspaceRow>
    </ReviewWorkspace>
  );
}
