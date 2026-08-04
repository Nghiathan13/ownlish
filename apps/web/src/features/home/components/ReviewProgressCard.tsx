"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import type {
  CollectionSummary,
  OxfordProgressSummary,
} from "@/entities/collection/api/collections";
import { getOxfordProgressSummary } from "@/entities/collection/api/collections";
import { getOxfordProgressSummaryQueryKey } from "@/entities/collection/lib/collectionsCache";
import { getUserOwnedCollections } from "@/entities/collection/lib/collectionDisplay";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import type { VocabStats } from "@/entities/vocab/api/vocab";
import { getVocabStats } from "@/entities/vocab/api/vocab";
import { getVocabStatsQueryKey } from "@/entities/vocab/lib/vocabStatsCache";
import {
  OXFORD_BANDS,
  type OxfordBand,
} from "@/features/collections/oxford/lib/oxfordNavigation";
import {
  useOxfordProgressSummary,
  type OxfordProgressBand,
} from "@/features/home/hooks/useOxfordProgressSummary";
import {
  useVocabStats,
  type VocabStatsCollectionId,
} from "@/features/home/hooks/useVocabStats";
import { classNames } from "@/shared/lib/classNames";
import { ApiError } from "@/shared/api/http";
import { useT } from "@/shared/providers/LocaleProvider";
import { BarChartIcon } from "@/shared/ui/icons/BarChartIcon";
import { CheckIcon } from "@/shared/ui/icons/CheckIcon";
import { DonutChartIcon } from "@/shared/ui/icons/DonutChartIcon";
import { FilterIcon } from "@/shared/ui/icons/FilterIcon";
import { Tooltip } from "@/shared/ui/Tooltip";
import { iconButtonGroupClassName } from "@/shared/ui/Tooltip/tooltipTheme";

type ProgressSource = "collection" | "oxford";
type ProgressView = "summary" | "levels";

type ReviewProgressCardProps = {
  collections: CollectionSummary[];
  isAuthenticated: boolean;
  userId: string | null;
};

type FilterOption = {
  id: string;
  label: string;
};

export function ReviewProgressCard({
  collections,
  isAuthenticated,
  userId,
}: ReviewProgressCardProps) {
  const t = useT();
  const [source, setSource] = useState<ProgressSource>("collection");
  const [view, setView] = useState<ProgressView>("summary");
  const userCollections = getUserOwnedCollections(collections);
  const collectionOptions = useMemo<FilterOption[]>(
    () =>
      userCollections.map((collection) => ({
        id: collection.id,
        label: collection.name,
      })),
    [userCollections],
  );
  const bandOptions = useMemo<FilterOption[]>(
    () => OXFORD_BANDS.map((band) => ({ id: band, label: band })),
    [],
  );
  const allCollectionIds = useMemo(
    () => collectionOptions.map((option) => option.id),
    [collectionOptions],
  );
  const allBandIds = useMemo(
    () => bandOptions.map((option) => option.id),
    [bandOptions],
  );
  // null = all selected (default, and when new items appear they stay included)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<
    string[] | null
  >(null);
  const [selectedBandIds, setSelectedBandIds] = useState<string[] | null>(null);

  const activeCollectionIds = selectedCollectionIds ?? allCollectionIds;
  const activeBandIds = selectedBandIds ?? allBandIds;
  const isAllCollectionsSelected =
    allCollectionIds.length === 0 ||
    (activeCollectionIds.length === allCollectionIds.length &&
      allCollectionIds.every((id) => activeCollectionIds.includes(id)));
  const isAllBandsSelected =
    allBandIds.length === 0 ||
    (activeBandIds.length === allBandIds.length &&
      allBandIds.every((id) => activeBandIds.includes(id)));

  const collectionSelectionMode = getSelectionMode(
    activeCollectionIds.length,
    isAllCollectionsSelected,
  );
  const bandSelectionMode = getSelectionMode(
    activeBandIds.length,
    isAllBandsSelected,
  );

  const singleCollectionId: VocabStatsCollectionId | null =
    collectionSelectionMode === "single" ? activeCollectionIds[0] : "all";
  const singleBand: OxfordProgressBand =
    bandSelectionMode === "single"
      ? (activeBandIds[0] as OxfordBand)
      : "all";

  const vocab = useVocabStats({
    collectionId:
      source === "collection" &&
      (collectionSelectionMode === "all" || collectionSelectionMode === "single")
        ? singleCollectionId
        : null,
    enabled:
      source === "collection" &&
      (collectionSelectionMode === "all" || collectionSelectionMode === "single"),
    isAuthenticated,
    userId,
  });
  const oxford = useOxfordProgressSummary({
    band:
      source === "oxford" &&
      (bandSelectionMode === "all" || bandSelectionMode === "single")
        ? singleBand
        : "all",
    enabled:
      source === "oxford" &&
      (bandSelectionMode === "all" || bandSelectionMode === "single"),
    isAuthenticated,
    userId,
  });

  const multiCollectionQueries = useQueries({
    queries: activeCollectionIds.map((collectionId) => ({
      queryKey: getVocabStatsQueryKey(userId, collectionId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        runAuthenticatedRequest({
          request: (token) =>
            getVocabStats(token, {
              collectionId,
              signal,
            }),
        }),
      enabled:
        source === "collection" &&
        collectionSelectionMode === "multi" &&
        isAuthenticated &&
        Boolean(userId),
    })),
  });
  const multiBandQueries = useQueries({
    queries: activeBandIds.map((band) => ({
      queryKey: getOxfordProgressSummaryQueryKey(userId, band as OxfordBand),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        runAuthenticatedRequest({
          request: (token) =>
            getOxfordProgressSummary(token, {
              band: band as OxfordBand,
              signal,
            }),
        }),
      enabled:
        source === "oxford" &&
        bandSelectionMode === "multi" &&
        isAuthenticated &&
        Boolean(userId),
    })),
  });

  const multiCollectionStats = useMemo(() => {
    if (collectionSelectionMode !== "multi") return null;
    const stats = multiCollectionQueries
      .map((query) => query.data)
      .filter((item): item is VocabStats => item != null);
    if (stats.length === 0) return null;
    return mergeVocabStats(stats);
  }, [collectionSelectionMode, multiCollectionQueries]);

  const multiBandSummary = useMemo(() => {
    if (bandSelectionMode !== "multi") return null;
    const summaries = multiBandQueries
      .map((query) => query.data)
      .filter((item): item is OxfordProgressSummary => item != null);
    if (summaries.length === 0) return null;
    return mergeOxfordProgress(summaries);
  }, [bandSelectionMode, multiBandQueries]);

  const progress =
    source === "collection"
      ? collectionSelectionMode === "empty"
        ? EMPTY_PROGRESS
        : collectionSelectionMode === "multi"
          ? toCollectionProgress(multiCollectionStats)
          : toCollectionProgress(vocab.stats)
      : bandSelectionMode === "empty"
        ? EMPTY_PROGRESS
        : bandSelectionMode === "multi"
          ? multiBandSummary
          : oxford.summary;

  const activeError =
    source === "collection"
      ? collectionSelectionMode === "multi"
        ? firstQueryError(multiCollectionQueries)
        : vocab.error
      : bandSelectionMode === "multi"
        ? firstQueryError(multiBandQueries)
        : oxford.error;
  const isLoading =
    source === "collection"
      ? collectionSelectionMode === "empty"
        ? false
        : collectionSelectionMode === "multi"
          ? multiCollectionQueries.some((query) => query.isLoading)
          : vocab.isLoading
      : bandSelectionMode === "empty"
        ? false
        : bandSelectionMode === "multi"
          ? multiBandQueries.some((query) => query.isLoading)
          : oxford.isLoading;

  function toggleCollection(id: string) {
    setSelectedCollectionIds((current) => {
      const base = current ?? allCollectionIds;
      const next = base.includes(id)
        ? base.filter((item) => item !== id)
        : [...base, id];
      return isFullSelection(next, allCollectionIds) ? null : next;
    });
  }

  function toggleBand(id: string) {
    setSelectedBandIds((current) => {
      const base = current ?? allBandIds;
      const next = base.includes(id)
        ? base.filter((item) => item !== id)
        : [...base, id];
      return isFullSelection(next, allBandIds) ? null : next;
    });
  }

  return (
    <article className="flex h-full min-h-[328px] min-w-[250px] w-full flex-col rounded-2xl border border-border bg-surface pt-3 pr-3 pb-4 pl-4 dark:bg-background lg:min-h-0">
      <div className="flex shrink-0 items-end gap-3">
        <div
          aria-label={t("dashboard.reviewProgress")}
          className="relative flex min-w-0 flex-1 items-end gap-9 px-3"
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
        <div className="flex shrink-0 items-center gap-2 pb-2">
          <ProgressViewButton
            onClick={() =>
              setView((currentView) =>
                currentView === "summary" ? "levels" : "summary",
              )
            }
            view={view}
          />
          {source === "collection" ? (
            <ProgressFilterDropdown
              ariaLabel={t("dashboard.filterCollections")}
              onToggle={toggleCollection}
              options={collectionOptions}
              selectedIds={activeCollectionIds}
              tooltip={t("dashboard.filterCollections")}
            />
          ) : (
            <ProgressFilterDropdown
              ariaLabel={t("dashboard.filterBands")}
              onToggle={toggleBand}
              options={bandOptions}
              selectedIds={activeBandIds}
              tooltip={t("dashboard.filterBands")}
            />
          )}
        </div>
      </div>
      {activeError ? (
        <p className="mt-4 text-sm text-muted-foreground">{activeError}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
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

function ProgressFilterDropdown({
  ariaLabel,
  onToggle,
  options,
  selectedIds,
  tooltip,
}: {
  ariaLabel: string;
  onToggle: (id: string) => void;
  options: FilterOption[];
  selectedIds: string[];
  tooltip: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={classNames(
          "relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-foreground before:pointer-events-none before:absolute before:inset-0 before:rounded-md hover:before:bg-hover-overlay",
          iconButtonGroupClassName,
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <FilterIcon className="size-5" />
        {!isOpen ? (
          <Tooltip group="icon-button" placement="bottom">
            {tooltip}
          </Tooltip>
        ) : null}
      </button>

      {isOpen ? (
        <div
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+0.5rem)] right-0 z-20 min-w-[160px] rounded-lg border border-border bg-surface p-1 dark:bg-[#000000]"
          id={menuId}
          role="menu"
        >
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">—</p>
          ) : (
            options.map((option) => {
              const isSelected = selectedIds.includes(option.id);

              return (
                <button
                  aria-checked={isSelected}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-hover-overlay"
                  key={option.id}
                  onClick={() => onToggle(option.id)}
                  role="menuitemcheckbox"
                  type="button"
                >
                  <span className="inline-flex size-4 shrink-0 items-center justify-center">
                    {isSelected ? <CheckIcon className="size-4" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function getSelectionMode(
  selectedCount: number,
  isAllSelected: boolean,
): "empty" | "all" | "single" | "multi" {
  if (selectedCount === 0) return "empty";
  if (isAllSelected) return "all";
  if (selectedCount === 1) return "single";
  return "multi";
}

function isFullSelection(selected: string[], allIds: string[]) {
  return (
    allIds.length > 0 &&
    selected.length === allIds.length &&
    allIds.every((id) => selected.includes(id))
  );
}

function firstQueryError(
  queries: Array<{ error: Error | null }>,
): string | null {
  const error = queries.find((query) => query.error)?.error;
  if (!error) return null;
  return error instanceof ApiError ? error.message : "Cannot load dashboard.";
}

function mergeVocabStats(statsList: VocabStats[]): VocabStats {
  const levels = new Map<number, number>();
  let total = 0;
  let due = 0;
  let mastered = 0;
  let highWrongCount = 0;

  for (const stats of statsList) {
    total += stats.total;
    due += stats.due;
    mastered += stats.mastered;
    highWrongCount += stats.highWrongCount;
    for (const { count, level } of stats.levels) {
      levels.set(level, (levels.get(level) ?? 0) + count);
    }
  }

  return {
    total,
    due,
    mastered,
    highWrongCount,
    levels: Array.from(levels.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((left, right) => left.level - right.level),
  };
}

function mergeOxfordProgress(
  summaries: OxfordProgressSummary[],
): OxfordProgressSummary {
  const levelCounts = new Map<number, number>();
  let total = 0;
  let masteredCount = 0;
  let learningCount = 0;
  let newCount = 0;

  for (const summary of summaries) {
    total += summary.total;
    masteredCount += summary.masteredCount;
    learningCount += summary.learningCount;
    newCount += summary.newCount;
    for (const { count, level } of summary.levelCounts) {
      levelCounts.set(level, (levelCounts.get(level) ?? 0) + count);
    }
  }

  return {
    total,
    masteredCount,
    learningCount,
    newCount,
    levelCounts: Array.from({ length: 7 }, (_, index) => ({
      level: index + 1,
      count: levelCounts.get(index + 1) ?? 0,
    })),
  };
}

const EMPTY_PROGRESS: OxfordProgressSummary = {
  total: 0,
  masteredCount: 0,
  learningCount: 0,
  newCount: 0,
  levelCounts: Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: 0,
  })),
};

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
  const ringParts: DonutRingPart[] = [
    {
      fill: "color-mix(in srgb, var(--status-mastered) 14%, transparent)",
      stroke: "var(--status-mastered)",
      percent: masteredPercent,
    },
    {
      fill: "var(--information-background)",
      stroke: "var(--primary)",
      percent: learningPercent,
    },
    {
      // Lighter than status-new-background so the soft fill stays subtle.
      fill: "color-mix(in srgb, var(--status-new-background) 55%, transparent)",
      // status-new alone is quite light; mix with foreground so the border reads clearly.
      stroke:
        "color-mix(in srgb, var(--status-new) 45%, var(--foreground) 55%)",
      percent: newPercent,
    },
  ];
  const ringSegments = getRingSegments(ringParts);
  const ringBackground = createRingBackground(ringSegments);
  const ringDividerAngles =
    ringSegments.length > 1
      ? ringSegments.map((segment) => segment.startDeg)
      : [];
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
    <div className="mt-4 pr-1 flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 place-items-center">
        <div
          aria-label={`${total} ${t("dashboard.entries")}`}
          className="relative size-42 shrink-0 overflow-visible"
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: ringBackground,
              // Only paint the annulus (r_in → r_out). Center stays clear so the
              // inner pad for stroke AA does not show soft fill bleeding inward.
              maskImage: DONUT_RING_MASK,
              WebkitMaskImage: DONUT_RING_MASK,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskSize: "100% 100%",
              WebkitMaskSize: "100% 100%",
            }}
          />
          <svg
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              height: `calc(100% + ${DONUT_SVG_PAD_PX * 2}px)`,
              left: -DONUT_SVG_PAD_PX,
              top: -DONUT_SVG_PAD_PX,
              width: `calc(100% + ${DONUT_SVG_PAD_PX * 2}px)`,
            }}
            viewBox={`${-DONUT_SVG_PAD} ${-DONUT_SVG_PAD} ${DONUT_VIEWBOX + DONUT_SVG_PAD * 2} ${DONUT_VIEWBOX + DONUT_SVG_PAD * 2}`}
          >
            {ringSegments.map((segment) => (
              <g key={`${segment.startDeg}-${segment.endDeg}-${segment.stroke}`}>
                {describeRingArcs(segment.startDeg, segment.endDeg).map(
                  (path, index) => (
                    <path
                      d={path}
                      fill="none"
                      key={`${segment.startDeg}-arc-${index}`}
                      stroke={segment.stroke}
                      strokeLinecap="butt"
                      strokeWidth={DONUT_SEGMENT_STROKE_WIDTH}
                    />
                  ),
                )}
              </g>
            ))}
            {ringDividerAngles.map((angleDeg) => (
              <RadialRingLine
                angleDeg={angleDeg}
                className="dark:stroke-[var(--background)]"
                key={`divider-${angleDeg}`}
                stroke="var(--surface)"
                strokeWidth={DONUT_DIVIDER_WIDTH}
              />
            ))}
            {ringSegments.map((segment) => (
              <g key={`${segment.startDeg}-${segment.endDeg}-sides`}>
                {/* Open → into-cw, close → into-ccw (into the part, parallel to the white gap). */}
                <SegmentRadialSideBorder
                  angleDeg={segment.startDeg}
                  side="into-cw"
                  stroke={segment.stroke}
                />
                <SegmentRadialSideBorder
                  angleDeg={segment.endDeg}
                  side="into-ccw"
                  stroke={segment.stroke}
                />
              </g>
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            {/*
              Hole is slightly smaller than r_in (inner pad) so the inner stroke + AA
              can paint toward the center without being covered — mirror of outer SVG pad.
            */}
            <div
              className="grid place-items-center rounded-full bg-surface text-center dark:bg-background"
              style={{
                height: `${DONUT_HOLE_DIAMETER_PCT}%`,
                width: `${DONUT_HOLE_DIAMETER_PCT}%`,
              }}
            >
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
      </div>
      <div className="mt-4 grid min-w-40 shrink-0 gap-2 text-base">
        <ProgressLegendItem
          fill={ringParts[0].fill}
          label={t("dashboard.mastered")}
          stroke={ringParts[0].stroke}
          value={masteredCount}
        />
        <ProgressLegendItem
          fill={ringParts[1].fill}
          label={t("dashboard.learning")}
          stroke={ringParts[1].stroke}
          value={learningCount}
        />
        <ProgressLegendItem
          fill={ringParts[2].fill}
          label={t("dashboard.new")}
          stroke={ringParts[2].stroke}
          value={newCount}
        />
      </div>
    </div>
  );
}

type DonutRingPart = {
  fill: string;
  stroke: string;
  percent: number;
};

type DonutRingSegment = DonutRingPart & {
  startDeg: number;
  endDeg: number;
};

/**
 * Outer size-42 / hole size-28 in user space (1 unit ≈ 1px at default).
 * r_out was 80 (+4 → 84); r_in was 60 then −4 → 56.
 */
const DONUT_R_OUT = 84;
const DONUT_R_IN = 56;
const DONUT_VIEWBOX = DONUT_R_OUT * 2;
const DONUT_CENTER = DONUT_R_OUT;
/** Extra SVG viewBox pad so outer stroke anti-alias is not clipped (esp. bottom edge). */
const DONUT_SVG_PAD = 3;
const DONUT_SVG_PAD_PX = 3;
/**
 * Inner pad (mirror of outer): shrink the hole so inner stroke AA can paint
 * toward the center. Soft fill is masked to r_in→r_out so this pad stays clear.
 */
const DONUT_INNER_PAD = DONUT_SVG_PAD;
const DONUT_HOLE_R = DONUT_R_IN - DONUT_INNER_PAD;
const DONUT_HOLE_DIAMETER_PCT = ((DONUT_HOLE_R * 2) / DONUT_VIEWBOX) * 100;
/** closest-side 100% = r_out of the outer disc. */
const DONUT_R_IN_MASK_PCT = (DONUT_R_IN / DONUT_R_OUT) * 100;
const DONUT_RING_MASK = `radial-gradient(circle closest-side at center, transparent ${DONUT_R_IN_MASK_PCT}%, #000 ${DONUT_R_IN_MASK_PCT}%, #000 100%)`;
/** Ring thickness + extra length past inner/outer edges (split evenly). */
const DONUT_DIVIDER_EXTRA = 5;
const DONUT_R_IN_LINE = DONUT_R_IN - DONUT_DIVIDER_EXTRA / 2;
const DONUT_R_OUT_LINE = DONUT_R_OUT + DONUT_DIVIDER_EXTRA / 2;
/** White gap between parts; side borders are separate rects inside each part. */
const DONUT_DIVIDER_WIDTH = 4;
const DONUT_SEGMENT_STROKE_WIDTH = 2;
/** Side rect length: ring thickness (was −1px, then +1 → full thickness). */
const DONUT_SIDE_RECT_LENGTH = DONUT_R_OUT - DONUT_R_IN;
/** Mid-radius of side rects; −1px pulls both side borders toward the center. */
const DONUT_SIDE_RECT_R_MID = (DONUT_R_IN + DONUT_R_OUT) / 2 - 1;
/**
 * Place the side rect (same width as segment stroke) inside the part.
 * Tuned so side borders clear the white divider.
 */
const DONUT_SIDE_RECT_OFFSET_PX = 3;
/**
 * Stroke is centered on the path.
 * Outer: inset from r_out (into the ring) so the full stroke sits inside the disc.
 * Inner: inset from r_in toward the center (into the inner pad) — mirror of outer —
 * so AA is not covered by the hole.
 */
const DONUT_R_OUT_STROKE = DONUT_R_OUT - DONUT_SEGMENT_STROKE_WIDTH / 2;
const DONUT_R_IN_STROKE = DONUT_R_IN - DONUT_SEGMENT_STROKE_WIDTH / 2;
/**
 * Legend swatch outer edge = ring thickness. With border-box + segment stroke,
 * the border is counted inside that size (fill is smaller by 2×stroke).
 */
const DONUT_LEGEND_SWATCH_SIZE = DONUT_R_OUT - DONUT_R_IN;

function RadialRingLine({
  angleDeg,
  className,
  stroke,
  strokeWidth,
}: {
  angleDeg: number;
  className?: string;
  stroke: string;
  strokeWidth: number;
}) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const x1 = DONUT_CENTER + DONUT_R_IN_LINE * Math.sin(angleRad);
  const y1 = DONUT_CENTER - DONUT_R_IN_LINE * Math.cos(angleRad);
  const x2 = DONUT_CENTER + DONUT_R_OUT_LINE * Math.sin(angleRad);
  const y2 = DONUT_CENTER - DONUT_R_OUT_LINE * Math.cos(angleRad);

  return (
    <line
      className={className}
      stroke={stroke}
      strokeLinecap="butt"
      strokeWidth={strokeWidth}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    />
  );
}

/**
 * Radial side border for one segment edge. Same rotation as the boundary ray;
 * offset along the tangent into the part so the rect stays parallel to the white divider.
 */
function SegmentRadialSideBorder({
  angleDeg,
  side,
  stroke,
}: {
  angleDeg: number;
  side: "into-cw" | "into-ccw";
  stroke: string;
}) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const radialX = Math.sin(angleRad);
  const radialY = -Math.cos(angleRad);
  // Tangent in the direction of increasing angle (clockwise on this coordinate system).
  const tangentX = Math.cos(angleRad);
  const tangentY = Math.sin(angleRad);
  const sideSign = side === "into-cw" ? 1 : -1;
  const offset = sideSign * DONUT_SIDE_RECT_OFFSET_PX;
  const cx =
    DONUT_CENTER + DONUT_SIDE_RECT_R_MID * radialX + offset * tangentX;
  const cy =
    DONUT_CENTER + DONUT_SIDE_RECT_R_MID * radialY + offset * tangentY;
  const width = DONUT_SEGMENT_STROKE_WIDTH;
  const height = DONUT_SIDE_RECT_LENGTH;

  return (
    <rect
      fill={stroke}
      height={height}
      transform={`rotate(${angleDeg} ${cx} ${cy})`}
      width={width}
      x={cx - width / 2}
      y={cy - height / 2}
    />
  );
}

function getRingSegments(parts: DonutRingPart[]): DonutRingSegment[] {
  const visibleParts = parts.filter((part) => part.percent > 0);
  if (visibleParts.length === 0) return [];

  const totalPercent = visibleParts.reduce(
    (total, part) => total + part.percent,
    0,
  );
  let cursor = 0;

  return visibleParts.map((part) => {
    const size = (part.percent / totalPercent) * 360;
    const startDeg = cursor;
    const endDeg = cursor + size;
    cursor = endDeg;
    return { ...part, startDeg, endDeg };
  });
}

function createRingBackground(segments: DonutRingSegment[]) {
  if (segments.length === 0) {
    return "var(--status-new-background)";
  }
  if (segments.length === 1) {
    return segments[0].fill;
  }

  const stops = segments.map(
    (segment) =>
      `${segment.fill} ${segment.startDeg}deg ${segment.endDeg}deg`,
  );
  return `conic-gradient(${stops.join(", ")})`;
}

function polarPoint(radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: DONUT_CENTER + radius * Math.sin(angleRad),
    y: DONUT_CENTER - radius * Math.cos(angleRad),
  };
}

/** Outer + inner arcs for a segment (CSS conic degrees: 0 at top, clockwise). */
function describeRingArcs(startDeg: number, endDeg: number) {
  const delta = ((endDeg - startDeg) % 360 + 360) % 360;

  if (delta < 0.01) {
    return [];
  }

  // Full ring: two semicircles each so the stroke is continuous.
  if (delta >= 359.99) {
    return [
      `M ${DONUT_CENTER + DONUT_R_OUT_STROKE} ${DONUT_CENTER} A ${DONUT_R_OUT_STROKE} ${DONUT_R_OUT_STROKE} 0 1 1 ${DONUT_CENTER - DONUT_R_OUT_STROKE} ${DONUT_CENTER} A ${DONUT_R_OUT_STROKE} ${DONUT_R_OUT_STROKE} 0 1 1 ${DONUT_CENTER + DONUT_R_OUT_STROKE} ${DONUT_CENTER}`,
      `M ${DONUT_CENTER + DONUT_R_IN_STROKE} ${DONUT_CENTER} A ${DONUT_R_IN_STROKE} ${DONUT_R_IN_STROKE} 0 1 1 ${DONUT_CENTER - DONUT_R_IN_STROKE} ${DONUT_CENTER} A ${DONUT_R_IN_STROKE} ${DONUT_R_IN_STROKE} 0 1 1 ${DONUT_CENTER + DONUT_R_IN_STROKE} ${DONUT_CENTER}`,
    ];
  }

  const outerStart = polarPoint(DONUT_R_OUT_STROKE, startDeg);
  const outerEnd = polarPoint(DONUT_R_OUT_STROKE, endDeg);
  const innerStart = polarPoint(DONUT_R_IN_STROKE, startDeg);
  const innerEnd = polarPoint(DONUT_R_IN_STROKE, endDeg);
  const largeArc = delta > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y} A ${DONUT_R_OUT_STROKE} ${DONUT_R_OUT_STROKE} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `M ${innerStart.x} ${innerStart.y} A ${DONUT_R_IN_STROKE} ${DONUT_R_IN_STROKE} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
  ];
}

function ProgressViewButton({
  onClick,
  view,
}: {
  onClick: () => void;
  view: ProgressView;
}) {
  const t = useT();
  // Icon shows the target view; tooltip describes the action (like theme toggle).
  const switchesToSummary = view === "levels";
  const tooltip = switchesToSummary
    ? t("dashboard.switchToSummaryChart")
    : t("dashboard.switchToLevelsChart");

  return (
    <button
      aria-label={tooltip}
      className={classNames(
        "relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-foreground before:pointer-events-none before:absolute before:inset-0 before:rounded-md hover:before:bg-hover-overlay",
        iconButtonGroupClassName,
      )}
      onClick={onClick}
      type="button"
    >
      {switchesToSummary ? (
        <DonutChartIcon className="size-5" />
      ) : (
        <BarChartIcon className="size-5" />
      )}
      <Tooltip group="icon-button" placement="bottom">
        {tooltip}
      </Tooltip>
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
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
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
        "group/progress-tab relative inline-flex shrink-0 cursor-pointer whitespace-nowrap pb-3 text-base font-normal",
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
          "absolute -right-3 -left-3 bottom-[1px] h-[2.5px]",
          isActive
            ? "bg-foreground"
            : "bg-transparent group-hover/progress-tab:bg-border",
        )}
      />
    </button>
  );
}

function ProgressLegendItem({
  fill,
  label,
  stroke,
  value,
}: {
  fill: string;
  label: string;
  stroke: string;
  value: number;
}) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      {/*
        Outer size = ring thickness (r_out − r_in), border-box so the 2px stroke
        is included in that size (same stroke width as the donut segments).
      */}
      <span
        aria-hidden
        className="box-border shrink-0 rounded-[2px]"
        style={{
          backgroundColor: fill,
          borderColor: stroke,
          borderStyle: "solid",
          borderWidth: DONUT_SEGMENT_STROKE_WIDTH,
          height: DONUT_LEGEND_SWATCH_SIZE,
          width: DONUT_LEGEND_SWATCH_SIZE,
        }}
      />
      <span>{label}</span>
      <span
        className="ml-auto font-mono font-semibold tabular-nums"
        style={{ color: stroke }}
      >
        {value}
      </span>
    </p>
  );
}
