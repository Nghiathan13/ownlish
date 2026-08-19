import { LEARNING_ACTIVITY_CALENDAR_MODES } from "@/entities/learning-activity";
import { DASHBOARD_PROGRESS_PATH } from "@/shared/routes";

export const DASHBOARD_PROGRESS_MODES = [
  LEARNING_ACTIVITY_CALENDAR_MODES.REVIEW,
  LEARNING_ACTIVITY_CALENDAR_MODES.PRACTICE,
  LEARNING_ACTIVITY_CALENDAR_MODES.PART_PRACTICE,
  LEARNING_ACTIVITY_CALENDAR_MODES.MOCK,
  LEARNING_ACTIVITY_CALENDAR_MODES.DICTATION,
] as const;

export type DashboardProgressMode = (typeof DASHBOARD_PROGRESS_MODES)[number];

export const DEFAULT_DASHBOARD_PROGRESS_MODE: DashboardProgressMode =
  DASHBOARD_PROGRESS_MODES[0];

export function isDashboardProgressMode(
  value: string,
): value is DashboardProgressMode {
  return DASHBOARD_PROGRESS_MODES.includes(value as DashboardProgressMode);
}

export function parseDashboardProgressMode(
  value: string | null,
): DashboardProgressMode | null {
  if (value == null || !isDashboardProgressMode(value)) {
    return null;
  }

  return value;
}

export function getDashboardProgressPath(
  mode: DashboardProgressMode = DEFAULT_DASHBOARD_PROGRESS_MODE,
) {
  return `${DASHBOARD_PROGRESS_PATH}?mode=${mode}`;
}
