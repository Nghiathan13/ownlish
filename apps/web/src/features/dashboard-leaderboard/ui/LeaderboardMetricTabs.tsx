import Link from "next/link";
import { classNames } from "@/shared/lib/classNames";
import { useLocale } from "@/shared/lib/providers";
import {
  getExperienceMetricLocation,
  getLeaderboardPath,
  getStudyTimeMetricLocation,
  type LeaderboardLocation,
} from "../model/leaderboardLocation";

const metricTabClassName =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[15px] leading-[20px] font-normal";

export function LeaderboardMetricTabs({
  location,
}: {
  location: LeaderboardLocation;
}) {
  const { t } = useLocale();

  return (
    <div
      aria-label={t("dashboard.leaderboardMetric")}
      className="flex w-fit max-w-full gap-3 overflow-x-auto"
      role="tablist"
    >
      <LeaderboardMetricTab
        active={location.metric === "study-time"}
        href={getLeaderboardPath(getStudyTimeMetricLocation(location))}
        label={t("dashboard.leaderboardStudyTime")}
      />
      <LeaderboardMetricTab
        active={location.metric === "experience"}
        href={getLeaderboardPath(getExperienceMetricLocation())}
        label={t("dashboard.leaderboardExperience")}
      />
    </div>
  );
}

function LeaderboardMetricTab({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-selected={active}
      className={classNames(
        metricTabClassName,
        active
          ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
          : "bg-surface-subtle text-foreground hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
      )}
      href={href}
      role="tab"
      scroll={false}
    >
      {label}
    </Link>
  );
}
