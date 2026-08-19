"use client";

import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import {
  getLeaderboardLocation,
  LeaderboardPanel,
  type LeaderboardMetric,
} from "@/features/dashboard-leaderboard";
import { DashboardScreen } from "./DashboardScreen";

type DashboardLeaderboardPageProps = {
  anchorParam: string | null;
  metric: LeaderboardMetric;
  periodParam: string | null;
};

export function DashboardLeaderboardPage({
  anchorParam,
  metric,
  periodParam,
}: DashboardLeaderboardPageProps) {
  const { status, user } = useAuthSession();
  const location = getLeaderboardLocation({
    metric,
    period: periodParam,
    anchor: anchorParam,
  });

  return (
    <DashboardScreen>
      <div className="mt-6 flex min-h-0 flex-1 flex-col px-4 pb-4 max-lg:flex-none lg:px-16 lg:pb-8">
        <LeaderboardPanel
          isAuthenticated={isAuthenticatedStatus(status)}
          location={location}
          userId={user?.id ?? null}
        />
      </div>
    </DashboardScreen>
  );
}
