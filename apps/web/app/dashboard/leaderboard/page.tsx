import { DashboardLeaderboardPage } from "@/_pages/dashboard";
import { redirect } from "next/navigation";
import { DASHBOARD_LEADERBOARD_DEFAULT_PATH } from "@/shared/routes";

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

  if (params.metric === undefined) {
    redirect(DASHBOARD_LEADERBOARD_DEFAULT_PATH);
  }

  return (
    <DashboardLeaderboardPage
      anchorParam={getSingleSearchParam(params.anchor)}
      metricParam={getSingleSearchParam(params.metric)}
      periodParam={getSingleSearchParam(params.period)}
    />
  );
}
