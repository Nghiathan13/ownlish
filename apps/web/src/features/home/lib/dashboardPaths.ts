import type { MessageKey } from "@/shared/i18n/messages";

export const DASHBOARD_ROOT_PATH = "/dashboard";
export const DASHBOARD_MY_ACTIVITY_PATH = "/dashboard/my-activity";
export const DASHBOARD_PROGRESS_PATH = "/dashboard/progress";

export type DashboardSection = "activity" | "progress";

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
    href: DASHBOARD_PROGRESS_PATH,
    labelKey: "dashboard.tabProgress",
    section: "progress",
  },
];

export function getDashboardSectionPath(section: DashboardSection) {
  return section === "progress"
    ? DASHBOARD_PROGRESS_PATH
    : DASHBOARD_MY_ACTIVITY_PATH;
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

  return null;
}
