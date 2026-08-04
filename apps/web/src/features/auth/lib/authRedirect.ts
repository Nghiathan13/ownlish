import { DASHBOARD_MY_ACTIVITY_PATH } from "@/features/home/lib/dashboardPaths";

export function getSafeAuthRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DASHBOARD_MY_ACTIVITY_PATH;
  }

  if (value === "/login" || value.startsWith("/login?")) {
    return DASHBOARD_MY_ACTIVITY_PATH;
  }

  return value;
}
