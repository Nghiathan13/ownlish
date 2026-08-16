import { classNames } from "@/shared/lib/classNames";
import type { LeaderboardListEntry } from "../lib/leaderboardList";
import { LeaderboardAvatar } from "./LeaderboardAvatar";

export const leaderboardRowGridClassName =
  "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3";

export function LeaderboardRow({
  entry,
}: {
  entry: LeaderboardListEntry;
}) {
  return (
    <div
      className={classNames(
        `${leaderboardRowGridClassName} border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-hover-overlay`,
        entry.rank <= 3 && "bg-warning-background/35",
      )}
    >
      <span
        className={classNames(
          "font-mono font-semibold tabular-nums text-muted-foreground",
          entry.rank === 1 && "text-warning",
          entry.rank === 2 && "text-foreground",
          entry.rank === 3 && "text-information",
        )}
      >
        #{entry.rank}
      </span>
      <span className="flex min-w-0 items-center gap-3">
        <LeaderboardAvatar avatarUrl={entry.avatarUrl} />
        <span className="truncate font-medium text-foreground">
          {entry.displayName}
        </span>
      </span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {entry.value}
      </span>
    </div>
  );
}
