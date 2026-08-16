import type { LeaderboardLocation } from "../model/leaderboardLocation";

const DAY_MS = 24 * 60 * 60 * 1000;

export function formatLeaderboardPeriod(
  location: LeaderboardLocation,
  locale: "en" | "vi",
) {
  if (location.period === "all" || !location.anchor) {
    return locale === "vi" ? "Tất cả thời gian" : "All time";
  }

  const anchor = new Date(`${location.anchor}T00:00:00.000Z`);

  if (location.period === "month") {
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(anchor);
  }

  const end = new Date(anchor.getTime() + 6 * DAY_MS);
  const formatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    month: "short",
    year: anchor.getUTCFullYear() === end.getUTCFullYear() ? undefined : "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(anchor)} – ${formatter.format(end)}`;
}

export function formatStudyTime(seconds: number, locale: "en" | "vi") {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return locale === "vi" ? `${minutes} phút` : `${minutes} min`;
  }

  return locale === "vi"
    ? `${hours} giờ ${minutes} phút`
    : `${hours} h ${minutes} min`;
}
