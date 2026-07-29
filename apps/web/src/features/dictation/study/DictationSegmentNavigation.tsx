"use client";

import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getDictationProgress, getDictationThumbnailUrl } from "@/entities/dictation/api";
import type { DictationCatalogVideo, DictationSegment } from "@/entities/dictation/model/types";
import { getDictationProgressQueryKey } from "@/entities/dictation/model/queries";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { OverlayScrollArea } from "@/shared/ui/OverlayScrollArea";
import { getSegmentWordBadges } from "./lib/segmentBadges";

type OverlayThumb = {
  height: number;
  top: number;
};

type DictationSegmentNavigationProps = {
  activeSegmentId: string | null;
  activeVideoId: string;
  answeredSegmentIds: string[];
  disabled: boolean;
  onSelect: (segment: DictationSegment) => void;
  segments: DictationSegment[];
  videos: DictationCatalogVideo[];
};

const SCROLL_TRACK_INSET_PX = 0;

function getOverlayThumb(list: HTMLDivElement): OverlayThumb | null {
  const { clientHeight, scrollHeight, scrollTop } = list;
  if (scrollHeight <= clientHeight + 1) return null;

  const trackHeight = Math.max(0, clientHeight - SCROLL_TRACK_INSET_PX * 2);
  const height = Math.max(28, (clientHeight / scrollHeight) * trackHeight);
  const maxTop = trackHeight - height;
  const top =
    maxTop <= 0 ? 0 : (scrollTop / (scrollHeight - clientHeight)) * maxTop;

  return { height, top };
}

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getProgressLabel(
  progress: { answeredSegmentIds: string[]; completedAt: string | null; correctCount: number } | null | undefined,
  segmentCount: number,
  t: ReturnType<typeof useT>,
) {
  if (!progress) return t("dictation.notStarted");
  if (progress.completedAt) {
    return `${t("dictation.completed")}: ${progress.correctCount}/${segmentCount}`;
  }

  return `${t("dictation.progress")}: ${progress.answeredSegmentIds.length}/${segmentCount}`;
}

export function DictationSegmentNavigation({
  activeSegmentId,
  activeVideoId,
  answeredSegmentIds,
  disabled,
  onSelect,
  segments,
  videos,
}: DictationSegmentNavigationProps) {
  const t = useT();
  const { status, user } = useAuthSession();
  const listRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState<"transcript" | "video">("transcript");
  const [thumb, setThumb] = useState<OverlayThumb | null>(null);

  const syncThumb = useCallback(() => {
    const list = listRef.current;
    setThumb(list ? getOverlayThumb(list) : null);
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const activeSegment = list.querySelector<HTMLButtonElement>(
      '[aria-pressed="true"]',
    );
    if (activeSegment) {
      const centeredScrollTop =
        activeSegment.offsetTop -
        (list.clientHeight - activeSegment.offsetHeight) / 2;
      const maxScrollTop = list.scrollHeight - list.clientHeight;
      list.scrollTop = Math.min(Math.max(0, centeredScrollTop), maxScrollTop);
    }
    syncThumb();
  }, [activeSegmentId, syncThumb]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(syncThumb);
    observer.observe(list);
    return () => observer.disconnect();
  }, [syncThumb]);

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(event: PointerEvent) {
      const list = listRef.current;
      if (!list || !thumb) return;

      const rect = list.getBoundingClientRect();
      const trackHeight = list.clientHeight - SCROLL_TRACK_INSET_PX * 2;
      const maxTop = trackHeight - thumb.height;
      const nextTop = Math.min(
        Math.max(
          0,
          event.clientY -
            rect.top -
            SCROLL_TRACK_INSET_PX -
            dragOffsetRef.current,
        ),
        maxTop,
      );
      const maxScrollTop = list.scrollHeight - list.clientHeight;
      list.scrollTop = maxTop <= 0 ? 0 : (nextTop / maxTop) * maxScrollTop;
      syncThumb();
    }

    function handlePointerUp() {
      setIsDragging(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, syncThumb, thumb]);

  function handleThumbPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const list = listRef.current;
    if (!list || !thumb) return;

    event.preventDefault();
    event.stopPropagation();
    const rect = list.getBoundingClientRect();
    dragOffsetRef.current =
      event.clientY - rect.top - SCROLL_TRACK_INSET_PX - thumb.top;
    setIsDragging(true);
  }

  const showThumb = Boolean(thumb) && (isHovering || isDragging);
  const completedSegmentCount = segments.filter((segment) =>
    answeredSegmentIds.includes(segment.id),
  ).length;
  const completionPercentage =
    segments.length === 0 ? 0 : Math.round((completedSegmentCount / segments.length) * 100);
  const videoProgressQueries = useQueries({
    queries: videos.map((video) => ({
      queryKey: getDictationProgressQueryKey(user?.id ?? null, video.id),
      queryFn: () =>
        runAuthenticatedRequest({
          request: (token) => getDictationProgress(token, video.id),
        }),
      enabled:
        activeView === "video" && status === "authenticated" && Boolean(user),
      retry: false,
    })),
  });

  return (
    <aside
      className="relative flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden bg-surface dark:bg-[#000000]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsHovering(false);
      }}
    >
      <div className="relative shrink-0">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-[0.5px] bg-border lg:-left-2"
        />
        <div className="relative z-10 flex items-end gap-9 pl-7 lg:pl-3" role="tablist">
          {(["transcript", "video"] as const).map((view) => {
            const isActive = activeView === view;

            return (
              <button
                aria-selected={isActive}
                className={classNames(
                  "group/dictation-tab relative inline-flex cursor-pointer pb-3 text-base font-normal",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
                key={view}
                onClick={() => setActiveView(view)}
                role="tab"
                type="button"
              >
                {view === "transcript" ? t("dictation.transcript") : t("dictation.videos")}
                <span
                  aria-hidden
                  className={classNames(
                    "absolute -right-3 -left-3 bottom-[1px] h-[2.5px]",
                    isActive
                      ? "bg-foreground"
                      : "bg-transparent group-hover/dictation-tab:bg-border",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      {activeView === "transcript" ? (
        <>
          <div className="shrink-0 py-2 pl-4 pr-4 lg:pl-2">
            <div className="flex items-center justify-between text-sm tabular-nums text-muted-foreground">
              <span>
                {completedSegmentCount}/{segments.length}
              </span>
              <span className="font-semibold text-foreground">{completionPercentage}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#f0f0f0] dark:bg-surface">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          <div className="mx-0 mt-2 h-px shrink-0 bg-border lg:-ml-2 lg:mr-0" />

          <div className="relative min-h-0 flex-1">
            <div
              className="overlay-scroll-hide flex h-full min-h-0 flex-col gap-2 overflow-y-auto py-4 pl-4 pr-4 lg:pl-2"
              onScroll={syncThumb}
              ref={listRef}
            >
              {segments.map((segment, index) => {
                const isSelected = segment.id === activeSegmentId;
                const isAnswered = answeredSegmentIds.includes(segment.id);
                const wordBadges = getSegmentWordBadges(segment);

                return (
                  <button
                    aria-pressed={isSelected}
                    className={classNames(
                      "group relative grid h-auto w-full flex-none cursor-pointer grid-rows-[auto_auto] rounded-md border text-left before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-hover-overlay before:opacity-0 before:content-[''] hover:before:opacity-100 disabled:cursor-default",
                      isAnswered
                        ? "border-success-border bg-success-background"
                        : "border-border",
                      isSelected
                        ? "ring-1 ring-foreground ring-offset-2 ring-offset-background"
                        : "opacity-70",
                    )}
                    disabled={disabled}
                    key={segment.id}
                    onClick={() => onSelect(segment)}
                    type="button"
                  >
                    <span className="relative z-10 px-3 py-2 text-sm text-foreground">
                      {index + 1}
                    </span>
                    <span className="relative z-10 flex min-h-12 flex-wrap content-center gap-1.5 px-3 py-3">
                      {isAnswered ? (
                        <span className="text-sm text-foreground">{segment.text}</span>
                      ) : (
                        wordBadges.map((badge, wordIndex) => (
                          <span
                            aria-hidden
                            className="text-lg leading-none text-muted-foreground"
                            key={wordIndex}
                          >
                            {badge}
                          </span>
                        ))
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {thumb ? (
              <div
                aria-hidden
                className={classNames(
                  "pointer-events-none absolute top-0 right-0 bottom-0 w-3 transition-opacity duration-150",
                  showThumb ? "opacity-100" : "opacity-0",
                )}
              >
                <div
                  className={classNames(
                    "absolute right-0.5 w-1.5 rounded-full bg-foreground/30 hover:bg-foreground/45",
                    showThumb ? "pointer-events-auto cursor-grab" : "pointer-events-none",
                    isDragging && "cursor-grabbing bg-foreground/45",
                  )}
                  onPointerDown={handleThumbPointerDown}
                  style={{ height: thumb.height, top: thumb.top }}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <OverlayScrollArea
          className="h-full min-h-0 px-4 py-4 lg:pl-2 lg:pr-4"
          rootClassName="min-h-0 flex-1"
        >
          <div className="flex flex-col gap-3">
            {videos.map((video, index) => (
              <Link
                className={classNames(
                  "group flex h-[140px] min-w-0 overflow-hidden rounded-lg border bg-surface dark:bg-[#000000]",
                  video.id === activeVideoId
                    ? "border-primary"
                    : "border-transparent hover:border-primary focus-visible:border-primary focus-visible:outline-none",
                )}
                href={`/dictation/${video.id}`}
                key={video.id}
              >
                <div className="relative h-full shrink-0 aspect-video">
                  {/* YouTube serves this public thumbnail directly; routing it through Next image optimization adds no value here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={video.title}
                    className="block h-full w-full object-cover"
                    loading="lazy"
                    src={getDictationThumbnailUrl(video.youtubeVideoId)}
                  />
                  <span className="absolute right-2 bottom-2 rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground dark:bg-surface">
                    {formatDuration(video.durationSeconds)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <h2 className="line-clamp-3 font-semibold text-foreground">{video.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {video.segmentCount} {t("dictation.segments")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getProgressLabel(videoProgressQueries[index]?.data, video.segmentCount, t)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </OverlayScrollArea>
      )}
    </aside>
  );
}
