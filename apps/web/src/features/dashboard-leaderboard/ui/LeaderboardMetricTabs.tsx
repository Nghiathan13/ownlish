import { useLocale } from "@/shared/lib/providers";
import { PillTabs } from "@/shared/ui/pill-tabs";
import {
  getExperienceMetricLocation,
  getLeaderboardPath,
  getStudyTimeMetricLocation,
  LEADERBOARD_METRICS,
  type LeaderboardLocation,
  type LeaderboardMetric,
} from "../model/leaderboardLocation";

const leaderboardMetricLabelKeys = {
  experience: "dashboard.leaderboardExperience",
  "study-time": "dashboard.leaderboardStudyTime",
} as const;

function getMetricLocation(
  metric: LeaderboardMetric,
  location: LeaderboardLocation,
) {
  return metric === "experience"
    ? getExperienceMetricLocation()
    : getStudyTimeMetricLocation(location);
}

export function LeaderboardMetricTabs({
  location,
}: {
  location: LeaderboardLocation;
}) {
  const { t } = useLocale();

  return (
    <PillTabs
      activeKey={location.metric}
      ariaLabel={t("dashboard.leaderboardMetric")}
      items={LEADERBOARD_METRICS.map((metric) => ({
        href: getLeaderboardPath(getMetricLocation(metric, location)),
        key: metric,
        label: t(leaderboardMetricLabelKeys[metric]),
      }))}
    />
  );
}
