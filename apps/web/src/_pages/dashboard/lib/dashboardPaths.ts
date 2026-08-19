import type { MessageKey } from "@/shared/i18n";
import {
  DASHBOARD_LEADERBOARD_PATH,
  DASHBOARD_LEADERBOARD_DEFAULT_PATH,
  DASHBOARD_MY_ACTIVITY_PATH,
  DASHBOARD_PROGRESS_PATH,
  DASHBOARD_PROGRESS_DEFAULT_PATH,
  DASHBOARD_ROOT_PATH,
} from "@/shared/routes";

export {
  DASHBOARD_LEADERBOARD_PATH,
  DASHBOARD_MY_ACTIVITY_PATH,
  DASHBOARD_PROGRESS_PATH,
  DASHBOARD_PROGRESS_DEFAULT_PATH,
  DASHBOARD_ROOT_PATH,
};

export type DashboardSection = "activity" | "progress" | "leaderboard";

export type DashboardSubLink = {
  href: string;
  labelKey: MessageKey;
  section: DashboardSection;
};

export const DASHBOARD_SUB_LINKS: DashboardSubLink[] = [
  {
    href: DASHBOARD_MY_ACTIVITY_PATH,
    labelKey: "dashboard.tabMyActivity",
    section: "activity",
  },
  {
    href: DASHBOARD_PROGRESS_DEFAULT_PATH,
    labelKey: "dashboard.tabProgress",
    section: "progress",
  },
  {
    href: DASHBOARD_LEADERBOARD_DEFAULT_PATH,
    labelKey: "dashboard.tabLeaderboard",
    section: "leaderboard",
  },
];

export function getDashboardSectionPath(section: DashboardSection) {
  if (section === "progress") return DASHBOARD_PROGRESS_DEFAULT_PATH;
  if (section === "leaderboard") return DASHBOARD_LEADERBOARD_PATH;
  return DASHBOARD_MY_ACTIVITY_PATH;
}

export function parseDashboardSection(
  pathname: string,
): DashboardSection | null {
  if (
    pathname === DASHBOARD_MY_ACTIVITY_PATH ||
    pathname === `${DASHBOARD_MY_ACTIVITY_PATH}/`
  ) {
    return "activity";
  }

  if (
    pathname === DASHBOARD_PROGRESS_PATH ||
    pathname === `${DASHBOARD_PROGRESS_PATH}/`
  ) {
    return "progress";
  }

  if (
    pathname === DASHBOARD_LEADERBOARD_PATH ||
    pathname === `${DASHBOARD_LEADERBOARD_PATH}/`
  ) {
    return "leaderboard";
  }

  return null;
}
