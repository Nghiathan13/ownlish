"use client";

import { useState } from "react";
import { useCollectionsListQuery } from "@/entities/collection";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { useT } from "@/shared/lib/providers";
import { PillTabs } from "@/shared/ui/pill-tabs";
import type { ProgressSource } from "../model/types";
import { useDifficultReviewWords } from "../model/useDifficultReviewWords";
import {
  DASHBOARD_PROGRESS_MODES,
  getDashboardProgressPath,
  type DashboardProgressMode,
} from "../lib/progressMode";
import { DifficultReviewWordsCard } from "./DifficultReviewWordsCard";
import { ProgressSourceMenu } from "./ProgressSourceMenu";
import { ReviewProgressCard } from "./ReviewProgressCard";

const dashboardModeLabelKeys = {
  dictation: "dashboard.activityModeDictation",
  mock: "dashboard.activityModeMock",
  part_practice: "dashboard.activityModePartPractice",
  practice: "dashboard.activityModePractice",
  review: "dashboard.activityModeReview",
} as const;

type DashboardProgressPanelProps = {
  mode: DashboardProgressMode;
};

export function DashboardProgressPanel({ mode }: DashboardProgressPanelProps) {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const [progressSource, setProgressSource] =
    useState<ProgressSource>("collection");
  const { collections } = useCollectionsListQuery({
    isAuthenticated,
    userId,
  });
  const difficultReviewWords = useDifficultReviewWords({
    enabled: mode === "review",
    isAuthenticated,
    source: progressSource,
    userId,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardModeTabs mode={mode} />
      {mode === "review" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 max-lg:flex-none lg:pb-8 lg:px-16">
          <ProgressSourceMenu
            onSourceChange={setProgressSource}
            source={progressSource}
          />
          <div className="grid min-h-[328px] grid-cols-1 gap-4 max-lg:flex-none lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-1">
            <ReviewProgressCard
              collections={collections}
              isAuthenticated={isAuthenticated}
              source={progressSource}
              userId={userId}
            />
            <DifficultReviewWordsCard
              error={difficultReviewWords.error}
              isLoading={difficultReviewWords.isLoading}
              onRetry={() => void difficultReviewWords.reload()}
              words={difficultReviewWords.words}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DashboardModeTabs({ mode }: { mode: DashboardProgressMode }) {
  const t = useT();

  return (
    <PillTabs
      activeKey={mode}
      ariaLabel={t("dashboard.activityMode")}
      items={DASHBOARD_PROGRESS_MODES.map((item) => ({
        href: getDashboardProgressPath(item),
        key: item,
        label: t(dashboardModeLabelKeys[item]),
      }))}
    />
  );
}
