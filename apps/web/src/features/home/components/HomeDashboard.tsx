"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  LEARNING_ACTIVITY_CALENDAR_MODES,
} from "@/entities/learning-activity";
import {
  getCollectionsListPath,
  getDefaultUserCollection,
} from "@/entities/collection/lib/collectionDisplay";
import { SessionLoadingSkeleton } from "@/features/auth/components/SessionLoadingSkeleton";
import {
  isAuthenticatedStatus,
  isLoadingStatus,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { useCollectionsListQuery } from "@/features/collections/shared/data/hooks";
import { GuestLanding } from "@/features/home/components/GuestLanding";
import { DifficultReviewWordsCard } from "@/features/home/components/DifficultReviewWordsCard";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { LearningActivityCalendarCard } from "@/features/home/components/LearningActivityCalendarCard";
import { ReviewProgressCard } from "@/features/home/components/ReviewProgressCard";
import { useLearningActivityCalendar } from "@/features/home/hooks/useLearningActivityCalendar";
import { useDifficultReviewWords } from "@/features/home/hooks/useDifficultReviewWords";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import {
  primaryTextButtonClassName,
  secondaryTextButtonClassName,
} from "@/shared/ui/button";
import { ArrowForwardIcon } from "@/shared/ui/icons/ArrowForwardIcon";
import { PageShell } from "@/shared/ui/PageShell";

const dashboardButtonInteractionClassName =
  "gap-2 whitespace-nowrap transition duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px [&_svg]:size-5 [&_svg]:shrink-0";

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

export function HomeDashboard() {
  const t = useT();
  const { status, user } = useAuthSession();
  const isAuthenticated = isAuthenticatedStatus(status);
  const [dashboardMode, setDashboardMode] = useState<DashboardMode>(
    LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW,
  );
  const {
    collections,
    collectionsError,
    isLoadingCollections,
    reloadCollections,
  } = useCollectionsListQuery({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const defaultCollection = getDefaultUserCollection(collections);
  const learningActivity = useLearningActivityCalendar({
    isAuthenticated,
    userId: user?.id ?? null,
  });
  const difficultReviewWords = useDifficultReviewWords({
    enabled: dashboardMode === LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW,
    isAuthenticated,
    userId: user?.id ?? null,
  });

  if (isLoadingStatus(status)) {
    return <SessionLoadingSkeleton centered />;
  }

  if (!isAuthenticated) {
    return (
      <PageShell className="overflow-visible sm:overflow-x-visible sm:overflow-y-visible">
        <GuestLanding />
      </PageShell>
    );
  }

  return (
    <PageShell className="max-lg:overflow-y-auto" fillViewport>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:gap-8 lg:px-16 lg:py-8">
        {isLoadingCollections ? (
          <HomeDashboardSkeleton />
        ) : collectionsError ? (
          <DashboardMessage role="alert">
            <div>
              <p className="font-semibold text-foreground">
                {t("dashboard.collectionsLoadError")}
              </p>
              <p className="mt-1 text-sm">{collectionsError}</p>
            </div>
            <button
              className={secondaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              onClick={() => void reloadCollections()}
              type="button"
            >
              {t("dashboard.tryAgain")}
            </button>
          </DashboardMessage>
        ) : !defaultCollection ? (
          <DashboardMessage>
            <div className="max-w-xl">
              <p className="font-semibold text-foreground">
                {t("dashboard.setupTitle")}
              </p>
              <p className="mt-1 text-sm leading-6">
                {t("dashboard.setupDescription")}
              </p>
            </div>
            <Link
              className={primaryTextButtonClassName(
                dashboardButtonInteractionClassName,
              )}
              href={getCollectionsListPath("user")}
            >
              {t("dashboard.browseCollections")}
              <ArrowForwardIcon />
            </Link>
          </DashboardMessage>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-8">
            <div className="shrink-0">
              <LearningActivityCalendarCard
                calendar={learningActivity.calendar}
                isLoading={learningActivity.isLoading}
              />
            </div>
            <DashboardModeTabs mode={dashboardMode} onChange={setDashboardMode} />
            {dashboardMode === LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW ? (
              <div className="grid min-h-[328px] grid-cols-1 gap-4 max-lg:flex-none lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-1">
                <ReviewProgressCard
                  collections={collections}
                  isAuthenticated={isAuthenticated}
                  userId={user?.id ?? null}
                />
                <DifficultReviewWordsCard
                  error={difficultReviewWords.error}
                  isLoading={difficultReviewWords.isLoading}
                  onRetry={() => void difficultReviewWords.reload()}
                  words={difficultReviewWords.words}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </PageShell>
  );
}

const dashboardModeButtonClassName =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

function getDashboardModeButtonClassName(isActive: boolean) {
  return classNames(
    dashboardModeButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-[#f0f0f0] text-foreground hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
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
      className="flex w-fit max-w-full shrink-0 gap-3 overflow-x-auto"
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

function DashboardMessage({
  children,
  role,
}: {
  children: ReactNode;
  role?: "alert";
}) {
  return (
    <section
      className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-surface p-6 text-muted-foreground sm:flex-row sm:items-center sm:p-8"
      role={role}
    >
      {children}
    </section>
  );
}
