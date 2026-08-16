import { formatLeaderboardPeriod } from "../lib/leaderboardFormat";
import {
  getCurrentLeaderboardPeriod,
  type LeaderboardLocation,
} from "../model/leaderboardLocation";
import { classNames } from "@/shared/lib/classNames";
import { useLocale } from "@/shared/lib/providers";
import { iconButtonGroupClassName, Tooltip } from "@/shared/ui/Tooltip";

export function CurrentLeaderboardPeriodLabel({
  location,
}: {
  location: LeaderboardLocation;
}) {
  const { locale, t } = useLocale();
  const currentPeriod = getCurrentLeaderboardPeriod(location);
  const dateRange = formatLeaderboardPeriod(location, locale);

  if (!currentPeriod) {
    return <p className="text-sm font-medium text-foreground">{dateRange}</p>;
  }

  const currentLabel =
    currentPeriod === "week"
      ? t("dashboard.leaderboardCurrentWeek")
      : t("dashboard.leaderboardCurrentMonth");

  return (
    <span
      aria-label={`${currentLabel}: ${dateRange}`}
      className={classNames(
        "relative inline-flex cursor-help text-sm font-medium text-foreground",
        iconButtonGroupClassName,
      )}
      tabIndex={0}
    >
      {currentLabel}
      <Tooltip group="icon-button" placement="bottom">
        {dateRange}
      </Tooltip>
    </span>
  );
}
