import type { StudyTimeLeaderboardPeriod } from "@/entities/leaderboard";
import { DASHBOARD_LEADERBOARD_PATH } from "@/shared/routes";

export type LeaderboardMetric = "study-time" | "experience";

export type LeaderboardLocation = {
  metric: LeaderboardMetric;
  period: StudyTimeLeaderboardPeriod;
  anchor: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(value: string | null | undefined) {
  if (!value || !DATE_KEY_PATTERN.test(value)) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) || toDateKey(date) !== value
    ? null
    : date;
}

function getVietnamToday(now: Date) {
  return new Date(
    `${new Date(now.getTime() + 7 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)}T00:00:00.000Z`,
  );
}

function getWeekAnchor(date: Date) {
  const weekday = date.getUTCDay() || 7;

  return new Date(date.getTime() - (weekday - 1) * DAY_MS);
}

function getMonthAnchor(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function normalizeAnchor(
  period: Exclude<StudyTimeLeaderboardPeriod, "all">,
  date: Date,
) {
  return period === "week" ? getWeekAnchor(date) : getMonthAnchor(date);
}

function addMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

function parseLeaderboardMetric(
  value: string | null | undefined,
): LeaderboardMetric {
  return value === "experience" ? "experience" : "study-time";
}

function parseLeaderboardPeriod(
  value: string | null | undefined,
): StudyTimeLeaderboardPeriod {
  return value === "week" || value === "month" ? value : "all";
}

export function getLeaderboardLocation(
  input: {
    metric?: string | null;
    period?: string | null;
    anchor?: string | null;
  },
  now = new Date(),
): LeaderboardLocation {
  const metric = parseLeaderboardMetric(input.metric);
  const period = parseLeaderboardPeriod(input.period);

  if (metric === "experience" || period === "all") {
    return { metric, period, anchor: null };
  }

  const currentAnchor = normalizeAnchor(period, getVietnamToday(now));
  const parsedAnchor = parseDateKey(input.anchor);
  const anchor =
    parsedAnchor &&
    toDateKey(normalizeAnchor(period, parsedAnchor)) === toDateKey(parsedAnchor) &&
    parsedAnchor <= currentAnchor
      ? parsedAnchor
      : currentAnchor;

  return { metric, period, anchor: toDateKey(anchor) };
}

export function getLeaderboardPath(location: LeaderboardLocation) {
  const searchParams = new URLSearchParams({ metric: location.metric });

  if (location.metric === "study-time") {
    searchParams.set("period", location.period);
    if (location.anchor) searchParams.set("anchor", location.anchor);
  }

  return `${DASHBOARD_LEADERBOARD_PATH}?${searchParams.toString()}`;
}

export function getStudyTimeMetricLocation(
  location: LeaderboardLocation,
): LeaderboardLocation {
  return {
    metric: "study-time",
    period: location.period,
    anchor: location.metric === "study-time" ? location.anchor : null,
  };
}

export function getExperienceMetricLocation(): LeaderboardLocation {
  return { metric: "experience", period: "all", anchor: null };
}

export function getPreviousLeaderboardLocation(
  location: LeaderboardLocation,
): LeaderboardLocation | null {
  if (
    location.metric !== "study-time" ||
    location.period === "all" ||
    !location.anchor
  ) {
    return null;
  }

  const anchor = new Date(`${location.anchor}T00:00:00.000Z`);
  const previous =
    location.period === "week"
      ? new Date(anchor.getTime() - 7 * DAY_MS)
      : addMonths(anchor, -1);

  return { ...location, anchor: toDateKey(previous) };
}

export function getNextLeaderboardLocation(
  location: LeaderboardLocation,
  now = new Date(),
): LeaderboardLocation | null {
  if (
    location.metric !== "study-time" ||
    location.period === "all" ||
    !location.anchor
  ) {
    return null;
  }

  const anchor = new Date(`${location.anchor}T00:00:00.000Z`);
  const next =
    location.period === "week"
      ? new Date(anchor.getTime() + 7 * DAY_MS)
      : addMonths(anchor, 1);
  const current = normalizeAnchor(location.period, getVietnamToday(now));

  if (next > current) return null;

  return { ...location, anchor: toDateKey(next) };
}

export function getLeaderboardPeriodLocation(
  location: LeaderboardLocation,
  period: StudyTimeLeaderboardPeriod,
  now = new Date(),
): LeaderboardLocation {
  if (location.metric === "study-time" && location.period === period) {
    return location;
  }

  if (period === "all") {
    return { metric: "study-time", period, anchor: null };
  }

  return {
    metric: "study-time",
    period,
    anchor: toDateKey(normalizeAnchor(period, getVietnamToday(now))),
  };
}

export function getCurrentLeaderboardPeriod(
  location: LeaderboardLocation,
  now = new Date(),
): Exclude<StudyTimeLeaderboardPeriod, "all"> | null {
  if (
    location.metric !== "study-time" ||
    location.period === "all" ||
    !location.anchor
  ) {
    return null;
  }

  const currentAnchor = normalizeAnchor(location.period, getVietnamToday(now));

  return location.anchor === toDateKey(currentAnchor) ? location.period : null;
}
