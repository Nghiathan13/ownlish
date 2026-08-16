"use client";

import { useLocale } from "@/shared/lib/providers";
import { ExperienceLeaderboardState } from "./ExperienceLeaderboardState";
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
  const { t } = useLocale();
  const isStudyTime = location.metric === "study-time";
  const leaderboard = useStudyTimeLeaderboard({
    anchor: location.anchor,
    enabled: isStudyTime,
    isAuthenticated,
    period: location.period,
    userId,
  });

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
          <LeaderboardList
            entries={leaderboard.leaderboard?.entries ?? []}
            error={leaderboard.error}
            isLoading={leaderboard.isLoading}
            onRetry={() => void leaderboard.reload()}
          />
        </>
      ) : (
        <ExperienceLeaderboardState />
      )}
    </section>
  );
}
