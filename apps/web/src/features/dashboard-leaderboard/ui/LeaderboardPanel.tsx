"use client";

import { useLocale } from "@/shared/lib/providers";
import { toExperienceLeaderboardListEntries, toStudyTimeLeaderboardListEntries } from "../lib/leaderboardList";
import { useExperienceLeaderboard } from "../model/useExperienceLeaderboard";
import { LeaderboardList } from "./LeaderboardList";
import { LeaderboardMetricTabs } from "./LeaderboardMetricTabs";
import { LeaderboardPeriodControls } from "./LeaderboardPeriodControls";
import type { LeaderboardLocation } from "../model/leaderboardLocation";
import { useStudyTimeLeaderboard } from "../model/useStudyTimeLeaderboard";

type LeaderboardPanelProps = {
  isAuthenticated: boolean;
  location: LeaderboardLocation;
  userId: string | null;
};

export function LeaderboardPanel({
  isAuthenticated,
  location,
  userId,
}: LeaderboardPanelProps) {
  const { locale, t } = useLocale();
  const isStudyTime = location.metric === "study-time";
  const leaderboard = useStudyTimeLeaderboard({
    anchor: location.anchor,
    enabled: isStudyTime,
    isAuthenticated,
    period: location.period,
    userId,
  });
  const experienceLeaderboard = useExperienceLeaderboard({
    enabled: !isStudyTime,
    isAuthenticated,
    userId,
  });
  const entries = isStudyTime
    ? toStudyTimeLeaderboardListEntries(
        leaderboard.leaderboard?.entries ?? [],
        locale,
      )
    : toExperienceLeaderboardListEntries(
        experienceLeaderboard.leaderboard?.entries ?? [],
        locale,
      );
  const activeLeaderboard = isStudyTime ? leaderboard : experienceLeaderboard;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5">
      <header>
        <h1 className="text-[24px] leading-8 font-semibold text-foreground">
          {t("dashboard.leaderboardTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.leaderboardDescription")}
        </p>
      </header>
      <LeaderboardMetricTabs location={location} />
      {isStudyTime ? (
        <>
          <LeaderboardPeriodControls location={location} />
        </>
      ) : null}
      <LeaderboardList
        entries={entries}
        error={activeLeaderboard.error}
        isLoading={activeLeaderboard.isLoading}
        onRetry={() => void activeLeaderboard.reload()}
        valueLabel={
          isStudyTime
            ? t("dashboard.leaderboardStudyTime")
            : t("dashboard.leaderboardExperience")
        }
      />
    </section>
  );
}
