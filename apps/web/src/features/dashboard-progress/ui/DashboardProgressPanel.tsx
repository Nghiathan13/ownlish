"use client";

import { useState } from "react";
import { LEARNING_ACTIVITY_CALENDAR_MODES } from "@/entities/learning-activity";
import { useCollectionsListQuery } from "@/entities/collection";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/lib/providers";
import type { ProgressSource } from "../model/types";
import { useDifficultReviewWords } from "../model/useDifficultReviewWords";
import { DifficultReviewWordsCard } from "./DifficultReviewWordsCard";
import { ProgressSourceMenu } from "./ProgressSourceMenu";
import { ReviewProgressCard } from "./ReviewProgressCard";

const dashboardModes = [
  LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW,
  LEARNING_ACTIVITY_CALENDAR_MODES.PRACTICE,
  LEARNING_ACTIVITY_CALENDAR_MODES.PART_PRACTICE,
  LEARNING_ACTIVITY_CALENDAR_MODES.MOCK,
  LEARNING_ACTIVITY_CALENDAR_MODES.DICTATION,
] as const;

type DashboardMode = (typeof dashboardModes)[number];

const dashboardModeLabelKeys = {
  dictation: "dashboard.activityModeDictation",
  mock: "dashboard.activityModeMock",
  part_practice: "dashboard.activityModePartPractice",
  practice: "dashboard.activityModePractice",
  review: "dashboard.activityModeReview",
} as const;

const dashboardModeButtonClassName =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getDashboardModeButtonClassName(isActive: boolean) {
  return classNames(
    dashboardModeButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-surface-subtle text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
  );
}

export function DashboardProgressPanel() {
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const userId = user?.id ?? null;
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(
    LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW,
  );
  const [progressSource, setProgressSource] =
    useState<ProgressSource>("collection");
  const { collections } = useCollectionsListQuery({
    isAuthenticated,
    userId,
  });
  const difficultReviewWords = useDifficultReviewWords({
    enabled: dashboardMode === LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW,
    isAuthenticated,
    source: progressSource,
    userId,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardModeTabs mode={dashboardMode} onChange={setDashboardMode} />
      {dashboardMode === LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW ? (
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

function DashboardModeTabs({
  mode,
  onChange,
}: {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}) {
  const t = useT();

  return (
    <div
      aria-label={t("dashboard.activityMode")}
      className="mx-4 my-6 flex w-fit max-w-[calc(100%-2rem)] shrink-0 gap-3 overflow-x-auto lg:mx-16 lg:max-w-[calc(100%-8rem)]"
      role="tablist"
    >
      {dashboardModes.map((item) => {
        const isActive = item === mode;

        return (
          <button
            aria-selected={isActive}
            className={getDashboardModeButtonClassName(isActive)}
            key={item}
            onClick={() => onChange(item)}
            role="tab"
            type="button"
          >
            {t(dashboardModeLabelKeys[item])}
          </button>
        );
      })}
    </div>
  );
}
