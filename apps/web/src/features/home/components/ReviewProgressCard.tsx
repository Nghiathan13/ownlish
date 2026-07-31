import { useState, type CSSProperties } from "react";
import type {
  CollectionSummary,
  OxfordProgressSummary,
} from "@/entities/collection/api/collections";
import { getUserOwnedCollections } from "@/entities/collection/lib/collectionDisplay";
import type { VocabStats } from "@/entities/vocab/api/vocab";
import { OXFORD_BANDS } from "@/features/collections/oxford/lib/oxfordNavigation";
import {
  useOxfordProgressSummary,
  type OxfordProgressBand,
} from "@/features/home/hooks/useOxfordProgressSummary";
import {
  useVocabStats,
  type VocabStatsCollectionId,
} from "@/features/home/hooks/useVocabStats";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { BarChartIcon } from "@/shared/ui/icons/BarChartIcon";
import { DonutChartIcon } from "@/shared/ui/icons/DonutChartIcon";

type ProgressSource = "collection" | "oxford";
type ProgressView = "summary" | "levels";

type ReviewProgressCardProps = {
  collections: CollectionSummary[];
  isAuthenticated: boolean;
  userId: string | null;
};

const progressFilterButtonClassName =
  "inline-flex max-w-40 shrink-0 cursor-pointer items-center justify-center truncate rounded-lg px-3 py-1.5 text-[14px] leading-[20px] font-normal";

function getProgressFilterButtonClassName(isActive: boolean) {
  return classNames(
    progressFilterButtonClassName,
    isActive
      ? "bg-foreground text-background hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]"
      : "bg-[#f0f0f0] text-foreground hover:[box-shadow:inset_0_0_0_9999px_rgba(0,0,0,0.06)] dark:bg-surface dark:hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]",
  );
}

export function ReviewProgressCard({
  collections,
  isAuthenticated,
  userId,
}: ReviewProgressCardProps) {
  const t = useT();
  const [source, setSource] = useState<ProgressSource>("collection");
  const [view, setView] = useState<ProgressView>("summary");
  const [oxfordBand, setOxfordBand] = useState<OxfordProgressBand>("all");
  const [collectionId, setCollectionId] =
    useState<VocabStatsCollectionId>("all");
  const userCollections = getUserOwnedCollections(collections);
  const vocab = useVocabStats({
    collectionId,
    enabled: source === "collection",
    isAuthenticated,
    userId,
  });
  const oxford = useOxfordProgressSummary({
    band: oxfordBand,
    enabled: source === "oxford",
    isAuthenticated,
    userId,
  });
  const progress =
    source === "collection"
      ? toCollectionProgress(vocab.stats)
      : oxford.summary;
  const activeError =
    source === "collection" ? vocab.error : oxford.error;
  const isLoading =
    source === "collection" ? vocab.isLoading : oxford.isLoading;

  return (
    <article className="flex h-full min-h-[328px] w-full flex-col rounded-2xl border border-border bg-surface p-5 dark:bg-background lg:min-h-0">
      <div className="relative shrink-0">
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -left-5 -right-5 h-px bg-border"
        />
        <div
          aria-label={t("dashboard.reviewProgress")}
          className="relative flex gap-3"
          role="tablist"
        >
          <ProgressTab
            isActive={source === "collection"}
            label={t("dashboard.myCollection")}
            onClick={() => setSource("collection")}
          />
          <ProgressTab
            isActive={source === "oxford"}
            label={t("collections.oxford")}
            onClick={() => setSource("oxford")}
          />
        </div>
      </div>
      {activeError ? (
        <p className="mt-4 text-sm text-muted-foreground">{activeError}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mt-3 flex shrink-0 items-center gap-3">
            {source === "collection" ? (
              <CollectionProgressTabs
                activeCollectionId={collectionId}
                collections={userCollections}
                onSelectCollection={setCollectionId}
              />
            ) : (
              <OxfordProgressBandTabs
                activeBand={oxfordBand}
                onSelectBand={setOxfordBand}
              />
            )}
            <ProgressViewButton
              onClick={() =>
                setView((currentView) =>
                  currentView === "summary" ? "levels" : "summary",
                )
              }
              view={view}
            />
          </div>
          {isLoading ? (
            <div className="mt-4 min-h-0 flex-1 animate-pulse rounded-xl bg-muted" />
          ) : (
            <ProgressContent progress={progress} view={view} />
          )}
        </div>
      )}
    </article>
  );
}

function CollectionProgressTabs({
  activeCollectionId,
  collections,
  onSelectCollection,
}: {
  activeCollectionId: VocabStatsCollectionId;
  collections: CollectionSummary[];
  onSelectCollection: (collectionId: VocabStatsCollectionId) => void;
}) {
  const t = useT();

  return (
    <nav
      aria-label={t("dashboard.myCollections")}
      className="flex min-w-0 flex-1 gap-3 overflow-x-auto"
    >
      <button
        aria-pressed={activeCollectionId === "all"}
        className={getProgressFilterButtonClassName(activeCollectionId === "all")}
        onClick={() => onSelectCollection("all")}
        type="button"
      >
        {t("dashboard.all")}
      </button>
      {collections.map((collection) => {
        const isActive = collection.id === activeCollectionId;

        return (
          <button
            aria-pressed={isActive}
            className={getProgressFilterButtonClassName(isActive)}
            key={collection.id}
            onClick={() => onSelectCollection(collection.id)}
            title={collection.name}
            type="button"
          >
            {collection.name}
          </button>
        );
      })}
    </nav>
  );
}

function OxfordProgressBandTabs({
  activeBand,
  onSelectBand,
}: {
  activeBand: OxfordProgressBand;
  onSelectBand: (band: OxfordProgressBand) => void;
}) {
  const t = useT();
  const bands: OxfordProgressBand[] = ["all", ...OXFORD_BANDS];

  return (
    <nav
      aria-label={t("collections.oxfordCefrLevels")}
      className="flex min-w-0 flex-1 gap-3 overflow-x-auto"
    >
      {bands.map((band) => {
        const isActive = band === activeBand;

        return (
          <button
            aria-pressed={isActive}
            className={getProgressFilterButtonClassName(isActive)}
            key={band}
            onClick={() => onSelectBand(band)}
            type="button"
          >
            {band === "all" ? t("dashboard.all") : band}
          </button>
        );
      })}
    </nav>
  );
}

function toCollectionProgress(stats: VocabStats | null): OxfordProgressSummary {
  const newCount = stats?.levels.find(({ level }) => level === 0)?.count ?? 0;
  const learningCount =
    stats?.levels
      .filter(({ level }) => level >= 1 && level <= 6)
      .reduce((total, { count }) => total + count, 0) ?? 0;
  const masteredCount = stats?.mastered ?? 0;
  const total = stats?.total ?? 0;
  const levelCounts = Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: stats?.levels.find(({ level }) => level === index + 1)?.count ?? 0,
  }));

  return { total, masteredCount, learningCount, newCount, levelCounts };
}

function ProgressContent({
  progress,
  view,
}: {
  progress: OxfordProgressSummary | null;
  view: ProgressView;
}) {
  const t = useT();
  const newCount = progress?.newCount ?? 0;
  const learningCount = progress?.learningCount ?? 0;
  const masteredCount = progress?.masteredCount ?? 0;
  const total = progress?.total ?? 0;
  const masteredPercent = total > 0 ? (masteredCount / total) * 100 : 0;
  const learningPercent = total > 0 ? (learningCount / total) * 100 : 0;
  const newPercent = total > 0 ? (newCount / total) * 100 : 0;
  const ringStyle = {
    background: createRingBackground([
      { color: "var(--status-mastered)", percent: masteredPercent },
      { color: "var(--primary)", percent: learningPercent },
      { color: "var(--status-new)", percent: newPercent },
    ]),
  };
  const levelCounts = [
    { level: 0, count: newCount },
    ...(progress?.levelCounts ?? EMPTY_LEVEL_COUNTS),
  ];

  if (view === "levels") {
    return (
      <div className="mt-4 grid min-h-0 flex-1 grid-rows-8 gap-3">
        {levelCounts.map(({ count, level }) => (
          <LevelDistributionRow count={count} key={level} level={level} total={total} />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 place-items-center">
        <div
          aria-label={`${total} ${t("dashboard.entries")}`}
          className="grid size-40 shrink-0 place-items-center rounded-full"
          style={ringStyle}
        >
          <div className="grid size-30 place-items-center rounded-full bg-surface text-center dark:bg-background">
            <div className="grid gap-2">
              <span className="text-sm text-muted-foreground">
                {t("dashboard.total")}
              </span>
              <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                {total}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 grid min-w-40 shrink-0 gap-2 text-base">
        <ProgressLegendItem
          color=""
          label={t("dashboard.mastered")}
          style={{ backgroundColor: "var(--status-mastered)" }}
          value={masteredCount}
        />
        <ProgressLegendItem
          color="bg-primary"
          label={t("dashboard.learning")}
          value={learningCount}
        />
        <ProgressLegendItem
          color=""
          label={t("dashboard.new")}
          style={{ backgroundColor: "var(--status-new)" }}
          value={newCount}
        />
      </div>
    </div>
  );
}

function createRingBackground(
  parts: Array<{ color: string; percent: number }>,
) {
  const visibleParts = parts.filter((part) => part.percent > 0);

  if (visibleParts.length === 0) return "var(--status-new)";
  if (visibleParts.length === 1) return visibleParts[0].color;

  const gapDegrees = 2;
  const halfGapDegrees = gapDegrees / 2;
  const totalPercent = visibleParts.reduce((total, part) => total + part.percent, 0);
  let cursor = 0;
  const stops = [`var(--background) 0deg ${halfGapDegrees}deg`];

  for (const part of visibleParts) {
    const size = (part.percent / totalPercent) * 360;
    const start = cursor + halfGapDegrees;
    const end = cursor + size - halfGapDegrees;

    stops.push(`${part.color} ${start}deg ${end}deg`);
    cursor += size;
    stops.push(
      `var(--background) ${end}deg ${Math.min(360, cursor + halfGapDegrees)}deg`,
    );
  }

  return `conic-gradient(${stops.join(", ")})`;
}

function ProgressViewButton({
  onClick,
  view,
}: {
  onClick: () => void;
  view: ProgressView;
}) {
  const showsSummary = view === "levels";

  return (
    <button
      aria-label={showsSummary ? "Show summary" : "Show levels"}
      className="relative ml-auto inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground before:pointer-events-none before:absolute before:inset-0 before:rounded-md hover:text-foreground hover:before:bg-hover-overlay"
      onClick={onClick}
      type="button"
    >
      {showsSummary ? (
        <DonutChartIcon className="size-5" />
      ) : (
        <BarChartIcon className="size-5" />
      )}
    </button>
  );
}

const EMPTY_LEVEL_COUNTS = Array.from({ length: 7 }, (_, index) => ({
  level: index + 1,
  count: 0,
}));

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
    <div className="grid h-full grid-cols-[4rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{`${t("wordsTable.level")} ${level}`}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
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
      <span className="text-right font-mono font-semibold tabular-nums text-foreground">
        {percent}%
      </span>
    </div>
  );
}

function ProgressTab({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={isActive}
      className={classNames(
        "group/progress-tab relative flex-1 cursor-pointer whitespace-nowrap pb-3 text-base",
        isActive ? "text-foreground" : "text-muted-foreground",
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
      <span
        aria-hidden
        className={classNames(
          "absolute bottom-0 left-0 right-0 h-[2.5px]",
          isActive
            ? "bg-foreground"
            : "bg-transparent group-hover/progress-tab:bg-border",
        )}
      />
    </button>
  );
}

function ProgressLegendItem({
  color,
  label,
  style,
  value,
}: {
  color: string;
  label: string;
  style?: CSSProperties;
  value: number;
}) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <span aria-hidden className={`h-5 w-1.5 ${color}`} style={style} />
      <span>{label}</span>
      <span className="ml-auto font-mono font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </p>
  );
}
