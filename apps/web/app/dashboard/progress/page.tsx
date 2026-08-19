import {
  DashboardProgressPage,
  DEFAULT_DASHBOARD_PROGRESS_MODE,
  getDashboardProgressPath,
  parseDashboardProgressMode,
} from "@/_pages/dashboard";
import { redirect } from "next/navigation";

type DashboardProgressRouteProps = {
  searchParams: Promise<{
    mode?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

export default async function DashboardProgressRoute({
  searchParams,
}: DashboardProgressRouteProps) {
  const params = await searchParams;
  const mode = parseDashboardProgressMode(getSingleSearchParam(params.mode));

  if (mode == null) {
    redirect(getDashboardProgressPath(DEFAULT_DASHBOARD_PROGRESS_MODE));
  }

  return <DashboardProgressPage mode={mode} />;
}
