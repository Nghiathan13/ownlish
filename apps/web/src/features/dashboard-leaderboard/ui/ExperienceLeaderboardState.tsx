import { useLocale } from "@/shared/lib/providers";

export function ExperienceLeaderboardState() {
  const { t } = useLocale();

  return (
    <article className="flex min-h-[260px] items-center justify-center rounded-2xl border border-border bg-surface-card p-6 text-center">
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-foreground">
          {t("dashboard.leaderboardExperience")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t("dashboard.leaderboardExperienceV2")}
        </p>
      </div>
    </article>
  );
}
