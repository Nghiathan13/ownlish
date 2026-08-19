import {
  DashboardLeaderboardPage,
  DEFAULT_LEADERBOARD_METRIC,
  getLeaderboardPath,
  parseLeaderboardMetric,
} from "@/_pages/dashboard";
import { redirect } from "next/navigation";

type DashboardLeaderboardRouteProps = {
  searchParams: Promise<{
    anchor?: string | string[];
    metric?: string | string[];
    period?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function DashboardLeaderboardRoute({
  searchParams,
}: DashboardLeaderboardRouteProps) {
  const params = await searchParams;
  const metric = parseLeaderboardMetric(getSingleSearchParam(params.metric));

  if (metric == null) {
    redirect(
      getLeaderboardPath({
        metric: DEFAULT_LEADERBOARD_METRIC,
        period: "all",
        anchor: null,
      }),
    );
  }

  return (
    <DashboardLeaderboardPage
      anchorParam={getSingleSearchParam(params.anchor)}
      metric={metric}
      periodParam={getSingleSearchParam(params.period)}
    />
  );
}
