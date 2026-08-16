import Link from "next/link";
import { type StudyTimeLeaderboardPeriod } from "@/entities/leaderboard";
import { classNames } from "@/shared/lib/classNames";
import { useLocale } from "@/shared/lib/providers";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import {
  getLeaderboardPath,
  getLeaderboardPeriodLocation,
  getNextLeaderboardLocation,
  getPreviousLeaderboardLocation,
  type LeaderboardLocation,
} from "../model/leaderboardLocation";
import { CurrentLeaderboardPeriodLabel } from "./CurrentLeaderboardPeriodLabel";

const periods: StudyTimeLeaderboardPeriod[] = ["all", "week", "month"];

export function LeaderboardPeriodControls({
  location,
}: {
  location: LeaderboardLocation;
}) {
  const { t } = useLocale();
  const previous = getPreviousLeaderboardLocation(location);
  const next = getNextLeaderboardLocation(location);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        aria-label={t("dashboard.leaderboardPeriod")}
        className="flex w-fit max-w-full gap-2 overflow-x-auto"
        role="tablist"
      >
        {periods.map((period) => {
          const active = location.period === period;
          const nextLocation = getLeaderboardPeriodLocation(location, period);

          return (
            <Link
              aria-selected={active}
              className={classNames(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                active
                  ? "bg-surface-subtle text-foreground"
                  : "text-muted-foreground hover:bg-hover-overlay hover:text-foreground",
              )}
              href={getLeaderboardPath(nextLocation)}
              key={period}
              role="tab"
              scroll={false}
            >
              {period === "all"
                ? t("dashboard.leaderboardAllTime")
                : period === "week"
                  ? t("dashboard.leaderboardWeek")
                  : t("dashboard.leaderboardMonth")}
            </Link>
          );
        })}
      </div>
      {location.period !== "all" ? (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {previous ? (
            <Link
              aria-label={t("dashboard.leaderboardPreviousPeriod")}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-hover-overlay hover:text-foreground"
              href={getLeaderboardPath(previous)}
              scroll={false}
            >
              <ChevronLeftIcon className="size-5" />
            </Link>
          ) : null}
          <div className="min-w-40 text-center">
            <CurrentLeaderboardPeriodLabel location={location} />
          </div>
          {next ? (
            <Link
              aria-label={t("dashboard.leaderboardNextPeriod")}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-hover-overlay hover:text-foreground"
              href={getLeaderboardPath(next)}
              scroll={false}
            >
              <ChevronRightIcon className="size-5" />
            </Link>
          ) : (
            <button
              aria-label={t("dashboard.leaderboardNextPeriod")}
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground/45"
              disabled
              type="button"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
