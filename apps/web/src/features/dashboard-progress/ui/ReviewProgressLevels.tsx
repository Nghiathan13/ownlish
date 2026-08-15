"use client";

import type { OxfordProgressSummary } from "@/entities/collection";
import { useT } from "@/shared/lib/providers";

const EMPTY_LEVEL_COUNTS = Array.from({ length: 7 }, (_, index) => ({
  level: index + 1,
  count: 0,
}));

type ReviewProgressLevelsProps = {
  progress: OxfordProgressSummary | null;
};

export function ReviewProgressLevels({ progress }: ReviewProgressLevelsProps) {
  const newCount = progress?.newCount ?? 0;
  const total = progress?.total ?? 0;
  const levelCounts = [
    { level: 0, count: newCount },
    ...(progress?.levelCounts ?? EMPTY_LEVEL_COUNTS),
  ];

  return (
    <div className="mt-4 grid min-h-0 flex-1 grid-rows-8 gap-3">
      {levelCounts.map(({ count, level }) => (
        <LevelDistributionRow
          count={count}
          key={level}
          level={level}
          total={total}
        />
      ))}
    </div>
  );
}

function LevelDistributionRow({
  count,
  level,
  total,
}: {
  count: number;
  level: number;
  total: number;
}) {
  const t = useT();
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col justify-center gap-1 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground">
          {`${t("wordsTable.level")} ${level}`}
        </span>
        <span className="font-mono tabular-nums text-foreground">
          <span className="font-normal">{`(${count}/${total})`}</span>
          <span className="font-semibold">{` ${percent}%`}</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted-background">
        <div
          className="h-full rounded-full bg-primary"
          style={{
            backgroundColor:
              level === 0
                ? "var(--status-new)"
                : level === 7
                  ? "var(--status-mastered)"
                  : undefined,
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}
