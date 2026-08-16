import { useLocale } from "@/shared/lib/providers";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";
import type { LeaderboardListEntry } from "../lib/leaderboardList";
import { LeaderboardRow, leaderboardRowGridClassName } from "./LeaderboardRow";

export function LeaderboardList({
  entries,
  error,
  isLoading,
  onRetry,
  valueLabel,
}: {
  entries: LeaderboardListEntry[];
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  valueLabel: string;
}) {
  const { t } = useLocale();

  return (
    <article className="flex min-h-[360px] min-w-[250px] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface-card">
      <div
        className={`${leaderboardRowGridClassName} shrink-0 border-b border-border bg-surface-subtle px-4 py-3 text-sm font-medium text-muted-foreground`}
      >
        <span>{t("dashboard.leaderboardRank")}</span>
        <span>{t("dashboard.leaderboardLearner")}</span>
        <span>{valueLabel}</span>
      </div>
      {error ? (
        <div className="p-4 text-sm text-muted-foreground">
          <p>{error}</p>
          <button
            className="mt-3 text-foreground underline underline-offset-4"
            onClick={onRetry}
            type="button"
          >
            {t("dashboard.tryAgain")}
          </button>
        </div>
      ) : isLoading ? (
        <div
          aria-label={t("dashboard.leaderboardLoading")}
          className="grid gap-2 p-4"
          role="status"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <div
              className="h-12 animate-pulse rounded-md bg-muted-background"
              key={index}
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          {t("dashboard.leaderboardEmpty")}
        </p>
      ) : (
        <OverlayScrollArea className="h-full" rootClassName="min-h-0 flex-1">
          <div className="grid">
            {entries.map((entry, index) => (
              <LeaderboardRow
                entry={entry}
                key={`${entry.rank}-${entry.displayName}-${index}`}
              />
            ))}
          </div>
        </OverlayScrollArea>
      )}
    </article>
  );
}
