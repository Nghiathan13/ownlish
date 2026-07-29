"use client";

import Link from "next/link";
import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getDictationProgress,
  getDictationVideo,
  submitDictationAnswer,
} from "@/entities/dictation/api";
import {
  findDictationVideo,
  getDictationProgressQueryKey,
  getDictationVideoQueryKey,
} from "@/entities/dictation/model/queries";
import { getDictationCategoryPath } from "@/entities/dictation/model/categoryPath";
import type { DictationProgress, DictationSegment } from "@/entities/dictation/model/types";
import { useDictationCatalogQuery } from "@/entities/dictation/model/useDictationCatalogQuery";
import { runAuthenticatedRequest } from "@/entities/session/model/authenticatedRequest";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { classNames } from "@/shared/lib/classNames";
import { useT } from "@/shared/providers/LocaleProvider";
import { PageShell } from "@/shared/ui/PageShell";
import { iconOnlyButtonClassName, iconTextButtonClassName } from "@/shared/ui/button";
import { AudioPauseIcon } from "@/shared/ui/icons/AudioPauseIcon";
import { AudioPlayIcon } from "@/shared/ui/icons/AudioPlayIcon";
import { AddIcon } from "@/shared/ui/icons/AddIcon";
import { ArrowBackIcon } from "@/shared/ui/icons/ArrowBackIcon";
import { LoopIcon } from "@/shared/ui/icons/LoopIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";
import { RightPanelOpenIcon } from "@/shared/ui/icons/RightPanelOpenIcon";
import { RemoveIcon } from "@/shared/ui/icons/RemoveIcon";
import { SkipNextIcon } from "@/shared/ui/icons/SkipNextIcon";
import { SkipPreviousIcon } from "@/shared/ui/icons/SkipPreviousIcon";
import { Skeleton } from "@/shared/ui/Skeleton";
import { iconButtonGroupClassName, Tooltip } from "@/shared/ui/Tooltip";
import { DictationHorizontalSplitLayout } from "./DictationHorizontalSplitLayout";
import { DictationSegmentNavigation } from "./DictationSegmentNavigation";
import { DictationSplitLayout } from "./DictationSplitLayout";
import {
  evaluateDictationTyping,
  getSegmentWords,
  getRawLetterPrefix,
  type DictationBadgeState,
} from "./lib/dictationTyping";
import { SEGMENT_END_TOLERANCE_MS } from "./lib/segmentPlayback";
import { YouTubeSegmentPlayer } from "./YouTubeSegmentPlayer";

const dictationBackButtonClassName = iconTextButtonClassName(
  "w-fit shrink-0 border border-border bg-surface hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] dark:bg-[#000000]",
);
const dictationBackIconButtonClassName = iconOnlyButtonClassName(
  "size-10 border border-border bg-surface hover:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)] [&_svg]:size-5 dark:bg-[#000000]",
);
const EMPTY_SEGMENTS: DictationSegment[] = [];
const EMPTY_HINTED_WORD_INDEXES: number[] = [];

function getActiveSegment(
  segments: DictationSegment[],
  progress: DictationProgress | null | undefined,
) {
  if (progress?.completedAt) return null;

  return (
    segments.find(
      (segment) => !progress?.answeredSegmentIds.includes(segment.id),
    ) ?? null
  );
}

function getBadgeClassName(state: DictationBadgeState) {
  switch (state) {
    case "green":
      return "relative rounded-lg border border-success-border bg-success-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-success";
    case "yellow":
      return "relative rounded-lg border border-information-border bg-information-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-information";
    case "red":
      return "relative rounded-lg border border-danger-border bg-danger-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-danger";
    default:
      return "relative rounded-lg border border-border bg-[#f0f0f0] px-3.5 py-2.5 text-xl leading-none tracking-wider text-muted-foreground dark:bg-surface";
  }
}

const hintedBadgeClassName =
  "relative rounded-lg border border-warning-border bg-warning-background px-3.5 py-2.5 text-xl leading-none tracking-wider text-warning";

const badgeHoverOverlayClassName =
  "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-hover-overlay before:opacity-0 before:content-[''] hover:before:opacity-100";

const extraWrongDraftClassName =
  "relative px-3.5 py-2.5 text-xl leading-none tracking-wider text-danger";

type VideoTimeline = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
};

const PLAYBACK_SPEED_MIN = 0.25;
const PLAYBACK_SPEED_MAX = 2;
const PLAYBACK_SPEED_STEP = 0.05;
const PLAYBACK_SPEED_STORAGE_KEY = "engvocab:dictation:playback-speed";
const playbackSpeedPresets = [0.5, 0.75, 1, 1.25, 1.5];
const FOLLOW_VIDEO_SEGMENT_START_OFFSET_MS = 300;
const PENDING_FOLLOW_SEGMENT_START_OFFSET_MS = -100;
const PENDING_FOLLOW_SEGMENT_END_OFFSET_MS = 400;

function formatVideoTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function formatPlaybackSpeed(speed: number) {
  return `${Number(speed.toFixed(2))}x`;
}

function getFollowVideoSegmentId(segments: DictationSegment[], currentTime: number) {
  const currentTimeMs = currentTime * 1000;

  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]!;
    if (currentTimeMs > segment.startMs + FOLLOW_VIDEO_SEGMENT_START_OFFSET_MS) {
      return segment.id;
    }
  }

  return null;
}

function DictationBadgeRevealTooltip({
  anchor,
  children,
}: {
  anchor: HTMLButtonElement | null;
  children: string;
}) {
  const [tooltipElement, setTooltipElement] = useState<HTMLSpanElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchor || !tooltipElement) return;
    const activeAnchor = anchor;
    const activeTooltipElement = tooltipElement;

    function updatePosition() {
      const anchorRect = activeAnchor.getBoundingClientRect();
      const tooltipRect = activeTooltipElement.getBoundingClientRect();
      const viewportPadding = 8;
      const belowTop = anchorRect.bottom + 8;
      const top =
        belowTop + tooltipRect.height <= window.innerHeight - viewportPadding
          ? belowTop
          : Math.max(viewportPadding, anchorRect.top - tooltipRect.height - 8);
      const left = Math.min(
        Math.max(viewportPadding, anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2),
        window.innerWidth - tooltipRect.width - viewportPadding,
      );

      setPosition({ left, top });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor, children, tooltipElement]);

  if (!anchor || typeof document === "undefined") return null;

  return createPortal(
    <span
      aria-hidden
      className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-semibold text-background"
      ref={setTooltipElement}
      style={position ? { left: position.left, top: position.top } : { left: 0, top: 0, visibility: "hidden" }}
    >
      {children}
    </span>,
    document.body,
  );
}

function getStoredPlaybackSpeed() {
  if (typeof window === "undefined") return 1;

  const speed = Number(window.localStorage.getItem(PLAYBACK_SPEED_STORAGE_KEY));
  return speed >= PLAYBACK_SPEED_MIN && speed <= PLAYBACK_SPEED_MAX ? speed : 1;
}

function DictationCollapsedPlayerControls({
  isPlaying,
  isLoopEnabled,
  isBelowVideo = false,
  onNextSegment,
  onPlaybackRateChange,
  onPreviousSegment,
  onReplay,
  onSeek,
  onToggleLoop,
  onTogglePlayback,
  playbackRate,
  timeline,
}: {
  isPlaying: boolean;
  isLoopEnabled: boolean;
  isBelowVideo?: boolean;
  onNextSegment: (() => void) | null;
  onPlaybackRateChange: (speed: number) => void;
  onPreviousSegment: (() => void) | null;
  onReplay: (() => void) | null;
  onSeek: (seconds: number) => void;
  onToggleLoop: () => void;
  onTogglePlayback: () => void;
  playbackRate: number;
  timeline: VideoTimeline;
}) {
  const t = useT();
  const [showRemainingTime, setShowRemainingTime] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [hoveredTargetSeconds, setHoveredTargetSeconds] = useState<number | null>(null);
  const speedControlRef = useRef<HTMLDivElement>(null);
  const progress =
    timeline.duration > 0
      ? Math.min(100, Math.max(0, (timeline.currentTime / timeline.duration) * 100))
      : 0;
  const hoveredProgress =
    hoveredTargetSeconds === null || timeline.duration <= 0
      ? null
      : Math.min(100, Math.max(0, (hoveredTargetSeconds / timeline.duration) * 100));
  const previewProgress = hoveredProgress !== null && hoveredProgress > progress ? hoveredProgress : null;
  const playbackSpeedProgress =
    ((playbackRate - PLAYBACK_SPEED_MIN) / (PLAYBACK_SPEED_MAX - PLAYBACK_SPEED_MIN)) *
    100;
  const speedMenuPositionClassName = "top-[calc(100%+12px)]";
  const speedMenuColorClassName = "bg-foreground/80 text-background dark:bg-foreground/80";
  const controlHoverOverlayClassName =
    "group-hover/control:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay)]";
  const speedPresetHoverOverlayClassName =
    "group-hover/control:[box-shadow:inset_0_0_0_9999px_var(--hover-overlay-solid)]";

  useEffect(() => {
    if (!isSpeedMenuOpen) return;

    function closeOnOutsidePointerDown(event: PointerEvent) {
      if (!speedControlRef.current?.contains(event.target as Node)) {
        setIsSpeedMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [isSpeedMenuOpen]);

  function getTargetSeconds(
    event: ReactMouseEvent<HTMLButtonElement> | ReactPointerEvent<HTMLButtonElement>,
  ) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (width <= 0 || timeline.duration <= 0) return null;

    const targetProgress = Math.min(Math.max(0, (event.clientX - left) / width), 1);
    return targetProgress * timeline.duration;
  }

  function changePlaybackRateByStep(direction: -1 | 1) {
    const nextSpeed = Number((playbackRate + direction * PLAYBACK_SPEED_STEP).toFixed(2));
    onPlaybackRateChange(Math.min(PLAYBACK_SPEED_MAX, Math.max(PLAYBACK_SPEED_MIN, nextSpeed)));
  }

  return (
    <div
      className={classNames(
        isBelowVideo
          ? "relative z-20 bg-transparent pt-2 text-foreground"
          : "mb-4 bg-background pb-3 pt-3 text-foreground",
      )}
    >
      <div className="relative">
        {hoveredTargetSeconds !== null && hoveredProgress !== null ? (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-[calc(100%+12px)] z-10 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1.5 text-sm tabular-nums text-white"
            style={{ left: `clamp(24px, ${hoveredProgress}%, calc(100% - 24px))` }}
          >
            {formatVideoTime(hoveredTargetSeconds)}
          </span>
        ) : null}
        <button
          aria-label="Seek video"
          className={classNames(
            "group/timeline relative block h-1 w-full cursor-pointer rounded-full hover:-my-px hover:h-[6px] disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            "bg-[#f0f0f0] [--timeline-hover:rgb(0_0_0)] [--timeline-hover-start:35%] [--timeline-hover-end:20%] dark:bg-surface dark:[--timeline-hover:rgb(255_255_255)] dark:[--timeline-hover-start:70%] dark:[--timeline-hover-end:40%]",
          )}
          disabled={timeline.duration <= 0}
          onClick={(event) => {
            const targetSeconds = getTargetSeconds(event);
            if (targetSeconds !== null) onSeek(targetSeconds);
          }}
          onPointerLeave={() => setHoveredTargetSeconds(null)}
          onPointerMove={(event) => setHoveredTargetSeconds(getTargetSeconds(event))}
          type="button"
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background:
                "linear-gradient(to right, var(--primary) 0%, var(--primary) max(0px, calc(100% - 24px)), color-mix(in srgb, var(--primary) 58%, rgb(255 255 255 / 0.3)) 100%)",
              width: `${progress}%`,
            }}
          />
          {previewProgress !== null ? (
            <span
              className="absolute inset-y-0 rounded-full"
              style={{
                background:
                  "linear-gradient(to right, color-mix(in srgb, var(--timeline-hover) var(--timeline-hover-start), transparent) 0%, color-mix(in srgb, var(--timeline-hover) var(--timeline-hover-start), transparent) max(0px, calc(100% - 24px)), color-mix(in srgb, var(--timeline-hover) var(--timeline-hover-end), transparent) 100%)",
                left: `${progress}%`,
                width: `${previewProgress - progress}%`,
              }}
            />
          ) : null}
          <span
            className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary group-hover/timeline:size-3"
            style={{ left: `${progress}%` }}
          />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center justify-between pr-2">
          <button
            aria-label={showRemainingTime ? "Show elapsed time" : "Show remaining time"}
            className="group/control relative flex h-10 cursor-pointer items-center rounded-full bg-foreground/5 px-3 text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/15"
            onClick={() => setShowRemainingTime((value) => !value)}
            type="button"
          >
            <span
              aria-hidden
              className={classNames(
                "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                controlHoverOverlayClassName,
              )}
            />
            <span className="relative">
              {showRemainingTime
                ? `-${formatVideoTime(timeline.duration - timeline.currentTime)}`
                : formatVideoTime(timeline.currentTime)}{" "}
              / {formatVideoTime(timeline.duration)}
            </span>
          </button>
          <div className="flex items-center gap-2">
            {onPreviousSegment ? (
              <button
                aria-label="Previous segment"
                className={classNames(
                  `group/control relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/15 ${iconButtonGroupClassName}`,
                  "text-foreground",
                )}
                onClick={onPreviousSegment}
                type="button"
              >
                <span
                  aria-hidden
                  className={classNames(
                    "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                    controlHoverOverlayClassName,
                  )}
                />
                <SkipPreviousIcon className="relative size-5" />
                <Tooltip group="icon-button" placement="bottom">
                  {t("dictation.previousSegment")}
                </Tooltip>
              </button>
            ) : null}
            <button
              aria-label="Replay active segment"
              className={classNames(
                `group/control relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-50 dark:bg-foreground/15 ${iconButtonGroupClassName}`,
                "text-foreground",
              )}
              disabled={!onReplay}
              onClick={onReplay ?? undefined}
              type="button"
            >
              <span
                aria-hidden
                className={classNames(
                  "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                  controlHoverOverlayClassName,
                )}
              />
              <ReplayIcon className="relative size-5" />
              <Tooltip group="icon-button" placement="bottom">
                <span className="inline-flex items-center gap-1.5">
                  <span>{t("dictation.replay")}</span>
                  <span className="opacity-70">Ctrl</span>
                </span>
              </Tooltip>
            </button>
          </div>
        </div>
        <div className="relative flex justify-center">
          <button
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className={classNames(
              `group/control relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/15 ${iconButtonGroupClassName}`,
              "text-foreground",
            )}
            onClick={onTogglePlayback}
            type="button"
          >
            <span
              aria-hidden
              className={classNames(
                "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                controlHoverOverlayClassName,
              )}
            />
            {isPlaying ? (
              <AudioPauseIcon className="relative size-7" />
            ) : (
              <AudioPlayIcon className="relative size-7" />
            )}
            <Tooltip group="icon-button" placement="bottom">
              {isPlaying ? t("dictation.pause") : t("dictation.play")}
            </Tooltip>
          </button>
          <button
            aria-pressed={isLoopEnabled}
            aria-label="Loop active segment"
            className={classNames(
              `group/control absolute left-[calc(50%+28px)] z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/15 ${iconButtonGroupClassName}`,
              isLoopEnabled ? "text-primary" : "text-foreground",
            )}
            onClick={onToggleLoop}
            type="button"
          >
            <span
              aria-hidden
              className={classNames(
                "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                controlHoverOverlayClassName,
              )}
            />
            <LoopIcon className="relative size-5" />
            <Tooltip group="icon-button" placement="bottom">
              {t("dictation.loopSegment")}
            </Tooltip>
          </button>
          {onNextSegment ? (
            <button
              aria-label="Next segment"
              className={classNames(
                `group/control absolute left-[calc(50%+76px)] z-10 flex size-10 cursor-pointer items-center justify-center rounded-full bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/15 ${iconButtonGroupClassName}`,
                "text-foreground",
              )}
              onClick={onNextSegment}
              type="button"
            >
              <span
                aria-hidden
                className={classNames(
                  "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                  controlHoverOverlayClassName,
                )}
              />
              <SkipNextIcon className="relative size-5" />
              <Tooltip group="icon-button" placement="bottom">
                <span className="inline-flex items-center gap-1.5">
                  <span>{t("dictation.nextSegment")}</span>
                  <span className="opacity-70">Shift + Enter</span>
                </span>
              </Tooltip>
            </button>
          ) : null}
        </div>
        <div className="relative flex justify-end pl-2" ref={speedControlRef}>
          {isSpeedMenuOpen ? (
            <div
              aria-label="Playback speed"
              className={classNames(
                "absolute right-0 z-20 w-[330px] rounded-lg p-4",
                speedMenuPositionClassName,
                speedMenuColorClassName,
              )}
            >
              <p className="text-center text-2xl font-medium tabular-nums">
                {playbackRate.toFixed(2)}x
              </p>
              <div className="mt-8 flex items-center gap-3">
                <button
                  aria-label="Decrease playback speed"
                  className="group/control relative flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground/50 text-background disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/70"
                  disabled={playbackRate <= PLAYBACK_SPEED_MIN}
                  onClick={() => changePlaybackRateByStep(-1)}
                  type="button"
                >
                  <span
                    aria-hidden
                    className={classNames(
                      "pointer-events-none absolute inset-[4px] rounded-full",
                      speedPresetHoverOverlayClassName,
                    )}
                  />
                  <RemoveIcon className="relative size-5" />
                </button>
                <input
                  aria-label="Playback speed"
                  className="block h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  max={PLAYBACK_SPEED_MAX}
                  min={PLAYBACK_SPEED_MIN}
                  onChange={(event) => onPlaybackRateChange(Number(event.target.value))}
                  step={PLAYBACK_SPEED_STEP}
                  style={{
                    background: `linear-gradient(to right, rgb(255 255 255 / 0.7) 0%, rgb(255 255 255 / 0.7) ${playbackSpeedProgress}%, rgb(255 255 255 / 0.3) ${playbackSpeedProgress}%)`,
                  }}
                  type="range"
                  value={playbackRate}
                />
                <button
                  aria-label="Increase playback speed"
                  className="group/control relative flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground/50 text-background disabled:cursor-default disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/70"
                  disabled={playbackRate >= PLAYBACK_SPEED_MAX}
                  onClick={() => changePlaybackRateByStep(1)}
                  type="button"
                >
                  <span
                    aria-hidden
                    className={classNames(
                      "pointer-events-none absolute inset-[4px] rounded-full",
                      speedPresetHoverOverlayClassName,
                    )}
                  />
                  <AddIcon className="relative size-5" />
                </button>
              </div>
              <div className="mt-8 flex gap-3">
                {playbackSpeedPresets.map((speed) => (
                  <button
                    className={classNames(
                      "group/control relative flex h-10 w-[50px] cursor-pointer items-center justify-center rounded-full text-[12px] tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      "bg-foreground/50 dark:bg-foreground/70",
                    )}
                    key={speed}
                    onClick={() => onPlaybackRateChange(speed)}
                    type="button"
                  >
                    <span
                      aria-hidden
                      className={classNames(
                        "pointer-events-none absolute inset-[4px] rounded-full",
                        speedPresetHoverOverlayClassName,
                      )}
                    />
                    <span className="relative">{formatPlaybackSpeed(speed)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button
            aria-expanded={isSpeedMenuOpen}
            aria-label="Playback speed"
            className="group/control relative flex h-10 cursor-pointer items-center rounded-full bg-foreground/5 px-3 text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-foreground/15"
            onClick={() => setIsSpeedMenuOpen((open) => !open)}
            type="button"
          >
            <span
              aria-hidden
              className={classNames(
                "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full",
                controlHoverOverlayClassName,
              )}
            />
            <span className="relative">{formatPlaybackSpeed(playbackRate)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DictationStudySkeleton() {
  return (
    <PageShell>
      <div className="w-full px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
          <Skeleton className="aspect-video rounded-lg" />
          <Skeleton className="h-[360px] rounded-lg" />
        </div>
      </div>
    </PageShell>
  );
}

export function DictationStudy({ videoId }: { videoId: string }) {
  const t = useT();
  const { status, user } = useAuthSession();
  const catalogQuery = useDictationCatalogQuery();
  const catalogVideo = useMemo(
    () => findDictationVideo(catalogQuery.data?.catalog.videos ?? [], videoId),
    [catalogQuery.data?.catalog.videos, videoId],
  );
  const backHref = catalogVideo ? getDictationCategoryPath(catalogVideo.category) : "/dictation";
  const videoQuery = useQuery({
    queryKey: getDictationVideoQueryKey(videoId),
    queryFn: ({ signal }) =>
      getDictationVideo(catalogQuery.data!, catalogVideo!, { signal }),
    enabled: Boolean(catalogQuery.data && catalogVideo),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const progressQueryKey = getDictationProgressQueryKey(user?.id ?? null, videoId);
  const progressQuery = useQuery({
    queryKey: progressQueryKey,
    queryFn: () =>
      runAuthenticatedRequest({
        request: (token) => getDictationProgress(token, videoId),
      }),
    enabled: status === "authenticated" && Boolean(user),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [videoSeekRequest, setVideoSeekRequest] = useState<{
    endMs: number;
    id: number;
    startSeconds: number;
  } | null>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(true);
  const [isMobileRightPanelOpen, setIsMobileRightPanelOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [isFollowVideoEnabled, setIsFollowVideoEnabled] = useState(false);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState(getStoredPlaybackSpeed);
  const [videoPlaybackCommand, setVideoPlaybackCommand] = useState<{
    action: "pause" | "play";
    id: number;
  } | null>(null);
  const [videoTimelineSeekRequest, setVideoTimelineSeekRequest] = useState<{
    id: number;
    targetSeconds: number;
  } | null>(null);
  const [pendingTimelineSeek, setPendingTimelineSeek] = useState<{
    id: number;
    targetSeconds: number;
  } | null>(null);
  const [videoTimeline, setVideoTimeline] = useState<VideoTimeline>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
  });
  const [draftSegmentId, setDraftSegmentId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [answeredSegmentIds, setAnsweredSegmentIds] = useState<string[]>([]);
  const [hintedWordIndexes, setHintedWordIndexes] = useState<number[]>([]);
  const [initialHintedWordIndexes, setInitialHintedWordIndexes] = useState<number[]>([]);
  const [revealTooltipAnchor, setRevealTooltipAnchor] = useState<HTMLButtonElement | null>(null);
  const hasHydratedProgressRef = useRef(false);
  const videoPlaybackCommandIdRef = useRef(0);
  const autoStartedVideoIdRef = useRef<string | null>(null);
  const segmentEndMsRef = useRef<number | null>(null);
  const videoSeekRequestIdRef = useRef(0);
  const videoTimelineSeekRequestIdRef = useRef(0);
  const pendingFollowSeekRef = useRef<{ id: number; startMs: number } | null>(null);
  const pendingFollowSegmentRef = useRef<{ startMs: number } | null>(null);
  const submittingSegmentIdsRef = useRef(new Set<string>());

  const progress = progressQuery.data;
  const segments = videoQuery.data?.segments ?? EMPTY_SEGMENTS;
  const progressSegment = getActiveSegment(segments, progress);
  const activeSegment =
    segments.find((segment) => segment.id === selectedSegmentId) ?? progressSegment;
  const activeSegmentId = activeSegment?.id ?? null;
  const activeSegmentIndex = activeSegment
    ? segments.findIndex((segment) => segment.id === activeSegment.id)
    : -1;
  const previousSegment = activeSegmentIndex > 0 ? segments[activeSegmentIndex - 1]! : null;
  const nextSegment =
    activeSegmentIndex >= 0 && activeSegmentIndex < segments.length - 1
      ? segments[activeSegmentIndex + 1]!
      : null;
  const segmentProgressLabel = t("dictation.segmentProgress")
    .replace("{current}", String(activeSegmentIndex + 1))
    .replace("{total}", String(segments.length));
  const isSegmentAnswered = Boolean(
    activeSegmentId && answeredSegmentIds.includes(activeSegmentId),
  );

  const expectedWords = useMemo(
    () => (activeSegment ? getSegmentWords(activeSegment) : []),
    [activeSegment],
  );
  const completedSegmentInput = expectedWords.map((word) => word.raw).join(" ");
  const activeAnswerInput = isSegmentAnswered
    ? completedSegmentInput
    : draftSegmentId === activeSegmentId
      ? answerInput
      : "";
  const activeHintedWordIndexes = draftSegmentId === activeSegmentId
    ? hintedWordIndexes
    : EMPTY_HINTED_WORD_INDEXES;
  const activeInitialHintedWordIndexes = draftSegmentId === activeSegmentId
    ? initialHintedWordIndexes
    : EMPTY_HINTED_WORD_INDEXES;
  const liveEvaluation = useMemo(
    () => evaluateDictationTyping(expectedWords, activeAnswerInput),
    [activeAnswerInput, expectedWords],
  );
  const handleVideoTimeChange = useCallback((timeline: VideoTimeline) => {
    if (
      pendingTimelineSeek &&
      Math.abs(timeline.currentTime - pendingTimelineSeek.targetSeconds) > 0.25
    ) {
      return;
    }

    if (pendingTimelineSeek) {
      setPendingTimelineSeek(null);
    }
    let shouldFollowVideo = isFollowVideoEnabled;
    const pendingFollowSegment = pendingFollowSegmentRef.current;
    if (pendingFollowSeekRef.current) {
      shouldFollowVideo = false;
    } else if (pendingFollowSegment) {
      if (!timeline.isPlaying) {
        shouldFollowVideo = false;
      } else {
        const currentTimeMs = timeline.currentTime * 1000;
        const isWithinPendingStartWindow =
          currentTimeMs >=
            pendingFollowSegment.startMs + PENDING_FOLLOW_SEGMENT_START_OFFSET_MS &&
          currentTimeMs <=
            pendingFollowSegment.startMs + PENDING_FOLLOW_SEGMENT_END_OFFSET_MS;

        if (isWithinPendingStartWindow) {
          shouldFollowVideo = false;
        } else {
          pendingFollowSegmentRef.current = null;
        }
      }
    }
    if (shouldFollowVideo) {
      const segmentId = getFollowVideoSegmentId(segments, timeline.currentTime);
      setSelectedSegmentId((current) => (current === segmentId ? current : segmentId));
    }
    setVideoTimeline((current) =>
      current.currentTime === timeline.currentTime &&
      current.duration === timeline.duration &&
      current.isPlaying === timeline.isPlaying
        ? current
        : timeline,
    );
  }, [isFollowVideoEnabled, pendingTimelineSeek, segments]);
  const handleVideoPlaybackStateChange = useCallback((isPlaying: boolean) => {
    setIsVideoPlaying((current) => (current === isPlaying ? current : isPlaying));
  }, []);
  const handleVideoPlaybackRateChange = useCallback((playbackRate: number) => {
    setVideoPlaybackRate((current) => (current === playbackRate ? current : playbackRate));
    window.localStorage.setItem(PLAYBACK_SPEED_STORAGE_KEY, String(playbackRate));
  }, []);
  const handleFollowVideoChange = useCallback((enabled: boolean) => {
    setIsFollowVideoEnabled(enabled);
    pendingFollowSeekRef.current = null;
    pendingFollowSegmentRef.current = null;
    if (enabled) {
      setSelectedSegmentId(getFollowVideoSegmentId(segments, videoTimeline.currentTime));
    }
  }, [segments, videoTimeline.currentTime]);
  const playSegment = useCallback((segment: DictationSegment) => {
    videoSeekRequestIdRef.current += 1;
    const requestId = videoSeekRequestIdRef.current;
    setVideoSeekRequest({
      endMs: segment.endMs,
      id: requestId,
      startSeconds: segment.startMs / 1000,
    });
    return requestId;
  }, []);
  const handleSegmentPlaybackStarted = useCallback((seekRequestId: number) => {
    const pendingSeek = pendingFollowSeekRef.current;
    if (!pendingSeek || pendingSeek.id !== seekRequestId) return;

    pendingFollowSeekRef.current = null;
    pendingFollowSegmentRef.current = { startMs: pendingSeek.startMs };
  }, []);
  const playSegmentWithFollowLock = useCallback((segment: DictationSegment) => {
    const seekRequestId = playSegment(segment);
    if (isFollowVideoEnabled) {
      pendingFollowSegmentRef.current = null;
      pendingFollowSeekRef.current = { id: seekRequestId, startMs: segment.startMs };
    }
  }, [isFollowVideoEnabled, playSegment]);
  const selectSegment = useCallback((segment: DictationSegment) => {
    setSelectedSegmentId(segment.id);
    setDraftSegmentId(null);
    setAnswerInput("");
    setHintedWordIndexes([]);
    setInitialHintedWordIndexes([]);
    playSegmentWithFollowLock(segment);
  }, [playSegmentWithFollowLock]);
  const handleSegmentEnd = useCallback(() => {
    if (isLoopEnabled && activeSegment) {
      playSegmentWithFollowLock(activeSegment);
    }
  }, [activeSegment, isLoopEnabled, playSegmentWithFollowLock]);
  const toggleVideoPlayback = useCallback(() => {
    videoPlaybackCommandIdRef.current += 1;
    setVideoPlaybackCommand({
      action: isVideoPlaying ? "pause" : "play",
      id: videoPlaybackCommandIdRef.current,
    });
  }, [isVideoPlaying]);
  const seekVideoFromTimeline = useCallback((targetSeconds: number) => {
    const targetMs = targetSeconds * 1000;
    const segmentEndMs = segmentEndMsRef.current;
    if (
      segmentEndMs !== null &&
      targetMs >= segmentEndMs - SEGMENT_END_TOLERANCE_MS
    ) {
      segmentEndMsRef.current = null;
      if (isLoopEnabled && activeSegment) {
        playSegmentWithFollowLock(activeSegment);
        return;
      }
    }

    videoTimelineSeekRequestIdRef.current += 1;
    const request = {
      id: videoTimelineSeekRequestIdRef.current,
      targetSeconds,
    };
    setVideoSeekRequest(null);
    setPendingTimelineSeek(request);
    setVideoTimeline((current) => ({ ...current, currentTime: targetSeconds }));
    setVideoTimelineSeekRequest(request);
  }, [activeSegment, isLoopEnabled, playSegmentWithFollowLock]);
  const badgeStates = isSegmentAnswered
    ? expectedWords.map(() => "green" as const)
    : liveEvaluation.badgeStates;
  const wrongDrafts = isSegmentAnswered ? [] : liveEvaluation.wrongDrafts;
  const yellowDrafts = isSegmentAnswered ? [] : liveEvaluation.yellowDrafts;
  const extraWrongDrafts = isSegmentAnswered ? [] : liveEvaluation.extraWrongDrafts;

  useEffect(() => {
    if (!activeSegment || autoStartedVideoIdRef.current === videoId) return;

    autoStartedVideoIdRef.current = videoId;
    playSegment(activeSegment);
  }, [activeSegment, playSegment, videoId]);

  useLayoutEffect(() => {
    if (hasHydratedProgressRef.current || !progressQuery.isFetched) return;

    hasHydratedProgressRef.current = true;
    setAnsweredSegmentIds(progressQuery.data?.answeredSegmentIds ?? []);
  }, [progressQuery.data?.answeredSegmentIds, progressQuery.isFetched]);

  function revealWordHint(index: number) {
    if (isSegmentAnswered || !activeSegmentId) return;
    if (badgeStates[index] === "green") return;

    setDraftSegmentId(activeSegmentId);
    setHintedWordIndexes((current) =>
      current.includes(index) ? current : [...current, index],
    );
  }

  useEffect(() => {
    let controlPressed = false;
    let controlUsedWithAnotherKey = false;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Control") {
        controlPressed = true;
        controlUsedWithAnotherKey = false;
        return;
      }

      if (controlPressed || event.ctrlKey) {
        controlUsedWithAnotherKey = true;
      }

      if (event.ctrlKey && event.key === "/") {
        event.preventDefault();
        const index = badgeStates.findIndex(
          (state, wordIndex) =>
            state !== "green" && !activeHintedWordIndexes.includes(wordIndex),
        );

        if (index >= 0 && !isSegmentAnswered && activeSegmentId) {
          setDraftSegmentId(activeSegmentId);
          if (activeInitialHintedWordIndexes.includes(index)) {
            setHintedWordIndexes((current) =>
              current.includes(index) ? current : [...current, index],
            );
          } else {
            setInitialHintedWordIndexes((current) =>
              current.includes(index) ? current : [...current, index],
            );
          }
        }
      }

      if (
        event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        event.key === "Enter" &&
        nextSegment
      ) {
        event.preventDefault();
        selectSegment(nextSegment);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key !== "Control") return;

      if (controlPressed && !controlUsedWithAnotherKey && activeSegment) {
        playSegmentWithFollowLock(activeSegment);
      }

      controlPressed = false;
      controlUsedWithAnotherKey = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    activeHintedWordIndexes,
    activeInitialHintedWordIndexes,
    activeSegment,
    activeSegmentId,
    badgeStates,
    isSegmentAnswered,
    nextSegment,
    playSegmentWithFollowLock,
    selectSegment,
  ]);

  useEffect(() => {
    if (
      !activeSegment ||
      !liveEvaluation.allMatched ||
      answeredSegmentIds.includes(activeSegment.id) ||
      submittingSegmentIdsRef.current.has(activeSegment.id) ||
      status !== "authenticated"
    ) {
      return;
    }

    const segmentId = activeSegment.id;
    submittingSegmentIdsRef.current.add(segmentId);
    setAnsweredSegmentIds((current) =>
      current.includes(segmentId) ? current : [...current, segmentId],
    );
    setSelectedSegmentId(segmentId);
    setDraftSegmentId(segmentId);
    setAnswerInput(completedSegmentInput);
    setHintedWordIndexes([]);

    const isCompleted = segments.every(
      (segment) => segment.id === segmentId || answeredSegmentIds.includes(segment.id),
    );

    void runAuthenticatedRequest({
      request: (token) =>
        submitDictationAnswer(token, {
          videoId,
          segmentId,
          isCompleted,
        }),
    })
      .catch(() => {
        setAnsweredSegmentIds((current) =>
          current.filter((id) => id !== segmentId),
        );
      })
      .finally(() => {
        submittingSegmentIdsRef.current.delete(segmentId);
      });
  }, [
    activeSegment,
    answeredSegmentIds,
    completedSegmentInput,
    expectedWords,
    liveEvaluation.allMatched,
    segments,
    status,
    videoId,
  ]);

  if (catalogQuery.isLoading || videoQuery.isLoading || progressQuery.isLoading) {
    return <DictationStudySkeleton />;
  }

  const loadError =
    catalogQuery.error || videoQuery.error
      ? t("dictation.lessonNotFound")
      : progressQuery.error
        ? t("dictation.progressLoadError")
        : null;

  if (!catalogVideo || !videoQuery.data || loadError) {
    return (
      <PageShell>
        <div className="w-full px-4 py-4">
          <div>
            <Link className={dictationBackButtonClassName} href={backHref}>
              {t("dictation.back")}
            </Link>
            <p className="mt-8 text-sm text-muted-foreground">{loadError ?? t("dictation.lessonNotFound")}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  function replayActiveSegment() {
    if (activeSegment) {
      playSegmentWithFollowLock(activeSegment);
    }
  }

  return (
    <PageShell className="lg:overflow-y-hidden">
      <div className="w-full py-4 pl-4 pr-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pr-0">
        <DictationSplitLayout
          isMobileRightPanelOpen={isMobileRightPanelOpen}
          onMobileRightPanelOpenChange={setIsMobileRightPanelOpen}
          header={
            <div className="flex shrink-0 items-center gap-4">
              <Link
                aria-label={t("dictation.back")}
                className={classNames(dictationBackIconButtonClassName, iconButtonGroupClassName)}
                href={backHref}
              >
                <ArrowBackIcon />
                <Tooltip className="!left-0 !translate-x-0" group="icon-button" placement="bottom">
                  {t("dictation.back")}
                </Tooltip>
              </Link>
              <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
                {videoQuery.data.video.title}
              </h1>
              <button
                className={`${dictationBackButtonClassName} ml-auto`}
                onClick={() => setIsVideoVisible((visible) => !visible)}
                type="button"
              >
                {isVideoVisible ? t("dictation.hideVideo") : t("dictation.showVideo")}
              </button>
              <button
                aria-expanded={isMobileRightPanelOpen}
                aria-label={t("dictation.showTranscriptPanel")}
                className={classNames(
                  "lg:hidden",
                  dictationBackIconButtonClassName,
                  iconButtonGroupClassName,
                )}
                onClick={() => setIsMobileRightPanelOpen(true)}
                type="button"
              >
                <RightPanelOpenIcon className="size-6" />
                <Tooltip group="icon-button" placement="bottom">
                  {t("dictation.showTranscriptPanel")}
                </Tooltip>
              </button>
            </div>
          }
          left={
            <DictationHorizontalSplitLayout
              isTopVisible={isVideoVisible}
              top={
                <>
                  <div className="flex justify-center">
                    <div className="w-full lg:w-[var(--dictation-video-panel-width)]">
                      <YouTubeSegmentPlayer
                        isTimeSyncEnabled
                        onPlaybackRateChange={handleVideoPlaybackRateChange}
                        onPlaybackStateChange={handleVideoPlaybackStateChange}
                        onSegmentEnd={handleSegmentEnd}
                        onSegmentPlaybackStarted={handleSegmentPlaybackStarted}
                        onTimeChange={handleVideoTimeChange}
                        playbackCommand={videoPlaybackCommand}
                        playbackRate={videoPlaybackRate}
                        segmentEndMsRef={segmentEndMsRef}
                        seekRequest={videoSeekRequest}
                        timelineSeekRequest={videoTimelineSeekRequest}
                        videoId={videoQuery.data.video.youtubeVideoId}
                      />
                    </div>
                  </div>
                  {isVideoVisible ? (
                    <DictationCollapsedPlayerControls
                      isBelowVideo
                      isPlaying={isVideoPlaying}
                      isLoopEnabled={isLoopEnabled}
                      onNextSegment={nextSegment ? () => selectSegment(nextSegment) : null}
                      onPlaybackRateChange={handleVideoPlaybackRateChange}
                      onPreviousSegment={
                        previousSegment ? () => selectSegment(previousSegment) : null
                      }
                      onReplay={activeSegment ? replayActiveSegment : null}
                      onSeek={seekVideoFromTimeline}
                      onToggleLoop={() => setIsLoopEnabled((enabled) => !enabled)}
                      onTogglePlayback={toggleVideoPlayback}
                      playbackRate={videoPlaybackRate}
                      timeline={videoTimeline}
                    />
                  ) : null}
                </>
              }
              bottom={
                <div>
                  {!isVideoVisible ? (
                    <DictationCollapsedPlayerControls
                      isPlaying={isVideoPlaying}
                      isLoopEnabled={isLoopEnabled}
                      onNextSegment={nextSegment ? () => selectSegment(nextSegment) : null}
                      onPlaybackRateChange={handleVideoPlaybackRateChange}
                      onPreviousSegment={
                        previousSegment ? () => selectSegment(previousSegment) : null
                      }
                      onReplay={activeSegment ? replayActiveSegment : null}
                      onSeek={seekVideoFromTimeline}
                      onToggleLoop={() => setIsLoopEnabled((enabled) => !enabled)}
                      onTogglePlayback={toggleVideoPlayback}
                      playbackRate={videoPlaybackRate}
                      timeline={videoTimeline}
                    />
                  ) : null}
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="text-sm font-semibold">{segmentProgressLabel}</span>
                    <div className="hidden flex-wrap items-center justify-end gap-3 lg:flex">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{t("dictation.replay")}</span>
                        <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-[#f0f0f0] px-1 text-[11px] font-medium text-foreground dark:bg-surface">
                          Ctrl
                        </kbd>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span>{t("dictation.nextSegment")}</span>
                        <kbd className="inline-flex h-5 items-center justify-center rounded border border-border bg-[#f0f0f0] px-1 text-[11px] font-medium text-foreground dark:bg-surface">
                          Shift + Enter
                        </kbd>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-warning">
                        <span>{t("dictation.hintShortcut")}</span>
                        <kbd className="inline-flex h-5 items-center justify-center rounded border border-warning-border bg-warning-background px-1 text-[11px] font-medium text-warning">
                          Ctrl + /
                        </kbd>
                      </span>
                    </div>
                  </div>
                  <input
                  autoComplete="off"
                  className={classNames(
                    "w-full rounded-lg border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary dark:bg-[#000000]",
                    isSegmentAnswered
                      ? "cursor-default text-success"
                      : "text-foreground",
                  )}
                  id="dictation-answer"
                  name="dictation-answer"
                    onChange={(event) => {
                    if (!isSegmentAnswered) {
                      setDraftSegmentId(activeSegmentId);
                      setAnswerInput(event.target.value);
                    }
                  }}
                  placeholder={t("dictation.typeWhatYouHear")}
                  readOnly={isSegmentAnswered}
                  type="text"
                  value={activeAnswerInput}
                />
                  {expectedWords.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                    {extraWrongDrafts
                      .filter((draft) => draft.afterBadgeIndex < 0)
                      .map((draft, draftIndex) => (
                        <span
                          aria-hidden
                          className={extraWrongDraftClassName}
                          key={`extra-before-${draftIndex}-${draft.text}`}
                        >
                          <span className="text-base leading-6 tracking-normal line-through">
                            {draft.text}
                          </span>
                        </span>
                      ))}
                    {expectedWords.map((word, index) => {
                      const state = badgeStates[index] ?? "idle";
                      const isHinted = activeHintedWordIndexes.includes(index);
                      const isInitialHinted = activeInitialHintedWordIndexes.includes(index);
                      const isGreen = state === "green";
                      const wrongDraft = wrongDrafts.find((draft) => draft.index === index);
                      const yellowDraft = yellowDrafts.find((draft) => draft.index === index);
                      const canHint = !isSegmentAnswered && !isGreen;
                      const shouldShowRevealTooltip = state === "idle" && !isHinted;
                      const badgeClassName = isGreen
                        ? getBadgeClassName("green")
                        : isHinted || isInitialHinted
                          ? hintedBadgeClassName
                          : getBadgeClassName(state);

                      return (
                        <span className="contents" key={`${word.raw}-${index}`}>
                          <button
                            aria-label={word.raw}
                            className={classNames(
                              badgeClassName,
                              "disabled:opacity-100",
                              canHint && "cursor-pointer",
                              canHint && badgeHoverOverlayClassName,
                              !canHint && "cursor-default",
                            )}
                            disabled={!canHint}
                            onBlur={() => setRevealTooltipAnchor(null)}
                            onClick={() => {
                              setRevealTooltipAnchor(null);
                              revealWordHint(index);
                            }}
                            onFocus={(event) => {
                              if (shouldShowRevealTooltip) setRevealTooltipAnchor(event.currentTarget);
                            }}
                            onPointerEnter={(event) => {
                              if (shouldShowRevealTooltip) setRevealTooltipAnchor(event.currentTarget);
                            }}
                            onPointerLeave={() => setRevealTooltipAnchor(null)}
                            type="button"
                          >
                            {isGreen ? (
                              <>
                                <span className="invisible relative z-10 text-xl leading-6 tracking-widest">
                                  {"•".repeat(Math.max(1, word.normalized.length))}
                                </span>
                                <span className="absolute inset-0 z-10 flex items-center justify-center text-base leading-6 tracking-normal">
                                  {word.raw}
                                </span>
                              </>
                            ) : isHinted ? (
                              <>
                                <span className="invisible relative z-10 text-xl leading-6 tracking-widest">
                                  {"•".repeat(Math.max(1, word.normalized.length))}
                                </span>
                                <span className="absolute inset-0 z-10 flex items-center justify-center text-base leading-6 tracking-normal">
                                  {word.raw}
                                </span>
                              </>
                            ) : isInitialHinted ? (
                              <span className="relative z-10 inline-flex items-center">
                                <span className="text-base leading-6 tracking-normal">
                                  {getRawLetterPrefix(word.raw, 1)}
                                </span>
                                <span className="text-xl leading-6 tracking-widest">
                                  {"•".repeat(Math.max(0, word.normalized.length - 1))}
                                </span>
                              </span>
                            ) : wrongDraft ? (
                              <span className="relative z-10 text-base leading-6 tracking-normal line-through">
                                {wrongDraft.text}
                              </span>
                            ) : yellowDraft ? (
                              <span className="relative z-10 inline-flex items-center">
                                <span className="text-base leading-6 tracking-normal">
                                  {yellowDraft.prefix}
                                </span>
                                <span className="text-xl leading-6 tracking-widest">
                                  {"•".repeat(
                                    Math.max(
                                      0,
                                      word.normalized.length - yellowDraft.matchedLength,
                                    ),
                                  )}
                                </span>
                              </span>
                            ) : (
                              <span className="relative z-10 text-xl leading-6 tracking-widest">
                                {"•".repeat(Math.max(1, word.normalized.length))}
                              </span>
                            )}
                          </button>
                          {extraWrongDrafts
                            .filter((draft) => draft.afterBadgeIndex === index)
                            .map((draft, draftIndex) => (
                              <span
                                aria-hidden
                                className={extraWrongDraftClassName}
                                key={`extra-after-${index}-${draftIndex}-${draft.text}`}
                              >
                                <span className="text-base leading-6 tracking-normal line-through">
                                  {draft.text}
                                </span>
                              </span>
                            ))}
                        </span>
                      );
                    })}
                    <DictationBadgeRevealTooltip anchor={revealTooltipAnchor}>
                      {t("dictation.revealWord")}
                    </DictationBadgeRevealTooltip>
                    </div>
                  ) : null}
                </div>
              }
            />
          }
          right={
            <DictationSegmentNavigation
              activeSegmentId={activeSegmentId}
              activeVideoId={videoId}
              answeredSegmentIds={answeredSegmentIds}
              disabled={false}
              isFollowVideoEnabled={isFollowVideoEnabled}
              onFollowVideoChange={handleFollowVideoChange}
              onSelect={selectSegment}
              segments={videoQuery.data.segments}
              videos={catalogQuery.data?.catalog.videos ?? []}
            />
          }
        />
      </div>
    </PageShell>
  );
}
