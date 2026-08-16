"use client";

import { RequireAuth } from "@/features/auth";
import { isAuthenticatedStatus, useAuthSession } from "@/entities/session";
import {
  getLeaderboardLocation,
  LeaderboardPanel,
} from "@/features/dashboard-leaderboard";
import { PageShell } from "@/shared/ui/PageShell";
import { DashboardTitleTabs } from "./DashboardTitleTabs";

type DashboardLeaderboardPageProps = {
  anchorParam: string | null;
  metricParam: string | null;
  periodParam: string | null;
};

export function DashboardLeaderboardPage(props: DashboardLeaderboardPageProps) {
  return (
    <RequireAuth>
      <DashboardLeaderboardPageContent {...props} />
    </RequireAuth>
  );
}

function DashboardLeaderboardPageContent({
  anchorParam,
  metricParam,
  periodParam,
}: DashboardLeaderboardPageProps) {
  const { status, user } = useAuthSession();
  const location = getLeaderboardLocation({
    metric: metricParam,
    period: periodParam,
    anchor: anchorParam,
  });

  return (
    <PageShell className="max-lg:overflow-y-auto" fillViewport>
      <DashboardTitleTabs />
      <div className="mt-6 flex min-h-0 flex-1 flex-col px-4 pb-4 max-lg:flex-none lg:px-16 lg:pb-8">
        <LeaderboardPanel
          isAuthenticated={isAuthenticatedStatus(status)}
          location={location}
          userId={user?.id ?? null}
        />
      </div>
    </PageShell>
  );
}
