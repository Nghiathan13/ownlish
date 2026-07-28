"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { DictationSegment } from "@/entities/dictation/model/types";
import { AudioPauseIcon } from "@/shared/ui/icons/AudioPauseIcon";
import { AudioPlayIcon } from "@/shared/ui/icons/AudioPlayIcon";
import { ReplayIcon } from "@/shared/ui/icons/ReplayIcon";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaybackRate: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (suggestedRate: number) => void;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      events: {
        onError: () => void;
        onPlaybackRateChange?: (event: { data: number }) => void;
        onReady: () => void;
        onStateChange?: (event: { data: number }) => void;
      };
      height: string;
      playerVars: Record<string, number>;
      videoId: string;
      width: string;
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;
const SEGMENT_PLAYBACK_PADDING_SECONDS = 1;
const PLAYBACK_RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];

function getSegmentStartSeconds(segment: DictationSegment) {
  return Math.max(0, segment.startMs / 1000 - SEGMENT_PLAYBACK_PADDING_SECONDS);
}

function getSegmentEndSeconds(segment: DictationSegment) {
  return segment.endMs / 1000 + SEGMENT_PLAYBACK_PADDING_SECONDS;
}

function formatTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function formatPlaybackRate(rate: number) {
  return `${Number(rate.toFixed(2))}x`;
}

function formatPlaybackRateWithTwoDecimals(rate: number) {
  return `${rate.toFixed(2)}x`;
}

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      youtubeApiPromise = null;
      reject(new Error("Cannot load YouTube player."));
    };
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        youtubeApiPromise = null;
        reject(new Error("Cannot load YouTube player."));
      }
    };
    document.head.append(script);
  });

  return youtubeApiPromise;
}

type YouTubeSegmentPlayerProps = {
  onError: () => void;
  onReady: () => void;
  playRequest: number;
  segment: DictationSegment | null;
  videoId: string;
};

export function YouTubeSegmentPlayer({
  onError,
  onReady,
  playRequest,
  segment,
  videoId,
}: YouTubeSegmentPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const playbackRateControlRef = useRef<HTMLDivElement>(null);
  const hoverBadgeRef = useRef<HTMLSpanElement>(null);
  const segmentRef = useRef(segment);
  const isSeekingRef = useRef(false);
  const resumePlaybackAfterSeekRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const enforceSegmentEndRef = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isPlaybackRateMenuOpen, setIsPlaybackRateMenuOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRemainingTime, setShowRemainingTime] = useState(false);
  const [hoverBadgeLeft, setHoverBadgeLeft] = useState<number | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [timeline, setTimeline] = useState({ currentTime: 0, duration: 0 });
  const segmentId = segment?.id ?? null;

  useEffect(() => {
    segmentRef.current = segment;
  }, [segment]);

  useEffect(() => {
    if (!isPlaybackRateMenuOpen) return;

    function closePlaybackRateMenu(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !playbackRateControlRef.current?.contains(event.target)
      ) {
        setIsPlaybackRateMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closePlaybackRateMenu);
    return () => document.removeEventListener("pointerdown", closePlaybackRateMenu);
  }, [isPlaybackRateMenuOpen]);

  useEffect(() => {
    let disposed = false;

    void loadYouTubeApi()
      .then((youtube) => {
        if (disposed || !mountRef.current) return;

        playerRef.current = new youtube.Player(mountRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => {
              const player = playerRef.current;
              setPlaybackRate(player?.getPlaybackRate() ?? 1);
              setIsReady(true);
              onReady();
            },
            onPlaybackRateChange: (event) => {
              setPlaybackRate(event.data);
            },
            onStateChange: (event) => {
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 0 || event.data === 2 || event.data === 5) {
                setIsPlaying(false);
              }
            },
            onError,
          },
        });
      })
      .catch(onError);

    return () => {
      disposed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setIsReady(false);
      setIsPlaying(false);
      setIsPlaybackRateMenuOpen(false);
      setPlaybackRate(1);
      setTimeline({ currentTime: 0, duration: 0 });
    };
  }, [onError, onReady, videoId]);

  useEffect(() => {
    const player = playerRef.current;
    const activeSegment = segmentRef.current;
    if (!player || !activeSegment) return;

    pendingSeekRef.current = null;
    enforceSegmentEndRef.current = true;
    player.pauseVideo();
    player.seekTo(getSegmentStartSeconds(activeSegment), true);
  }, [isReady, segmentId]);

  useEffect(() => {
    const player = playerRef.current;
    const activeSegment = segmentRef.current;
    if (!player || !activeSegment || playRequest === 0) return;

    pendingSeekRef.current = null;
    enforceSegmentEndRef.current = true;
    player.seekTo(getSegmentStartSeconds(activeSegment), true);
    player.playVideo();
  }, [isReady, playRequest, segmentId]);

  useEffect(() => {
    if (!isReady) return;

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      const activeSegment = segmentRef.current;
      if (!player || isSeekingRef.current) return;

      const reportedTime = player.getCurrentTime();
      const duration = player.getDuration();
      const pendingSeek = pendingSeekRef.current;
      const currentTime =
        pendingSeek !== null && Math.abs(reportedTime - pendingSeek) > 0.35
          ? pendingSeek
          : reportedTime;

      if (pendingSeek !== null && Math.abs(reportedTime - pendingSeek) <= 0.35) {
        pendingSeekRef.current = null;
      }

      if (duration > 0) {
        setTimeline({ currentTime, duration });
      }

      if (!activeSegment || !enforceSegmentEndRef.current) return;

      if (reportedTime >= getSegmentEndSeconds(activeSegment)) {
        enforceSegmentEndRef.current = false;
        player.pauseVideo();
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [isReady]);

  function isOutsideSegment(timeSeconds: number, activeSegment: DictationSegment) {
    return (
      timeSeconds < getSegmentStartSeconds(activeSegment) ||
      timeSeconds > getSegmentEndSeconds(activeSegment)
    );
  }

  function commitSeek(nextTime: number) {
    const player = playerRef.current;
    if (!player || timeline.duration <= 0) return;

    const currentTime = Math.min(Math.max(nextTime, 0), timeline.duration);
    const activeSegment = segmentRef.current;
    if (activeSegment && isOutsideSegment(currentTime, activeSegment)) {
      enforceSegmentEndRef.current = false;
    }

    pendingSeekRef.current = currentTime;
    player.seekTo(currentTime, true);
    setTimeline((value) => ({ ...value, currentTime }));

    window.setTimeout(() => {
      if (pendingSeekRef.current === currentTime) {
        pendingSeekRef.current = null;
      }
    }, 1500);
  }

  function previewSeek(nextTime: number) {
    const player = playerRef.current;
    if (!player || timeline.duration <= 0) return;

    const currentTime = Math.min(Math.max(nextTime, 0), timeline.duration);
    const activeSegment = segmentRef.current;
    if (activeSegment && isOutsideSegment(currentTime, activeSegment)) {
      enforceSegmentEndRef.current = false;
    }

    pendingSeekRef.current = currentTime;
    player.seekTo(currentTime, false);
    setTimeline((value) => ({ ...value, currentTime }));
  }

  function beginSeek(event: ReactPointerEvent<HTMLInputElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const player = playerRef.current;
    resumePlaybackAfterSeekRef.current = isPlaying;
    player?.pauseVideo();
    setIsPlaying(false);
    isSeekingRef.current = true;
    pendingSeekRef.current = null;
    setIsSeeking(true);
  }

  function updateHoveredTime(event: ReactPointerEvent<HTMLInputElement>) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    if (width <= 0 || timeline.duration <= 0) return;

    const progress = Math.min(Math.max(0, (event.clientX - left) / width), 1);
    setHoveredTime(progress * timeline.duration);
  }

  function endSeek(event: ReactPointerEvent<HTMLInputElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    commitSeek(Number(event.currentTarget.value));
    if (resumePlaybackAfterSeekRef.current) {
      playerRef.current?.playVideo();
      setIsPlaying(true);
    }
    resumePlaybackAfterSeekRef.current = false;
    isSeekingRef.current = false;
    setIsSeeking(false);
  }

  function togglePlayback() {
    const player = playerRef.current;
    if (!player || !isReady) return;

    if (isPlaying) {
      player.pauseVideo();
      return;
    }

    player.playVideo();
  }

  function replaySegment() {
    const player = playerRef.current;
    const activeSegment = segmentRef.current;
    if (!player || !isReady || !activeSegment) return;

    const startSeconds = getSegmentStartSeconds(activeSegment);
    pendingSeekRef.current = startSeconds;
    enforceSegmentEndRef.current = true;
    player.seekTo(startSeconds, true);
    player.playVideo();
    setTimeline((value) => ({ ...value, currentTime: startSeconds }));
  }

  function changePlaybackRate(rate: number) {
    const player = playerRef.current;
    if (!player) return;

    setPlaybackRate(rate);
    player.setPlaybackRate(rate);
  }

  const progress =
    timeline.duration > 0
      ? Math.min(100, Math.max(0, (timeline.currentTime / timeline.duration) * 100))
      : 0;
  const hoveredProgress =
    hoveredTime != null && timeline.duration > 0
      ? Math.min(100, Math.max(0, (hoveredTime / timeline.duration) * 100))
      : progress;
  const previewProgress = Math.max(progress, hoveredProgress);
  const hasHoverPreview = previewProgress > progress;
  const playbackRateProgress = Math.min(
    100,
    Math.max(0, ((playbackRate - 0.25) / 1.75) * 100),
  );
  const seekBarBackground = hasHoverPreview
    ? `linear-gradient(to right, var(--primary) 0%, var(--primary) max(0px, calc(${progress}% - 24px)), color-mix(in srgb, var(--primary) 58%, var(--audio-track)) ${progress}%, rgba(255,255,255,0.7) ${progress}%, rgba(255,255,255,0.7) max(${progress}%, calc(${previewProgress}% - 24px)), color-mix(in srgb, rgba(255,255,255,0.7) 58%, var(--audio-track)) ${previewProgress}%, var(--audio-track) ${previewProgress}%)`
    : `linear-gradient(to right, var(--primary) 0%, var(--primary) max(0px, calc(${progress}% - 24px)), color-mix(in srgb, var(--primary) 58%, var(--audio-track)) ${progress}%, var(--audio-track) ${progress}%)`;

  useLayoutEffect(() => {
    const badge = hoverBadgeRef.current;
    const container = badge?.parentElement;
    if (hoveredTime == null || !badge || !container) {
      setHoverBadgeLeft(null);
      return;
    }

    const containerWidth = container.clientWidth;
    const badgeHalfWidth = badge.offsetWidth / 2;
    const preferredCenter = (hoveredProgress / 100) * containerWidth;
    const minimumCenter = Math.min(badgeHalfWidth, containerWidth / 2);
    const maximumCenter = Math.max(minimumCenter, containerWidth - badgeHalfWidth);
    setHoverBadgeLeft(
      Math.min(Math.max(preferredCenter, minimumCenter), maximumCenter),
    );
  }, [hoveredProgress, hoveredTime]);
  const controlButtonClassName =
    "group/control relative flex size-10 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-50";
  const timeButtonClassName =
    "group/control relative flex h-10 cursor-pointer items-center rounded-full bg-black/30 px-3 text-sm tabular-nums text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-50";
  const controlHoverClassName =
    "pointer-events-none absolute inset-[4px] min-w-[32px] rounded-full group-hover/control:[box-shadow:inset_0_0_0_9999px_rgba(255,255,255,0.15)]";
  const playbackRateButtonClassName =
    "group/control relative flex h-10 cursor-pointer items-center justify-center rounded-full bg-black/30 px-3 text-sm tabular-nums text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:opacity-50";

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="h-full w-full" ref={mountRef} />
      </div>
      <button
        aria-label={isPlaying ? "Pause" : "Play"}
        className="absolute inset-0 z-[1] cursor-pointer disabled:cursor-default"
        disabled={!isReady}
        onClick={togglePlayback}
        type="button"
      />
      <div
        className={`absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-4 opacity-0 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 ${isSeeking || isPlaybackRateMenuOpen ? "pointer-events-auto opacity-100" : ""}`}
      >
        <div className="relative">
          <input
            aria-label="Seek video"
            className="block h-1 w-full cursor-pointer appearance-none rounded-full bg-black/70 hover:-my-px hover:h-[6px] accent-primary [--audio-track:rgba(0,0,0,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:[&::-moz-range-thumb]:size-3 hover:[&::-webkit-slider-thumb]:size-3 disabled:cursor-default [&::-moz-range-thumb]:size-2 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            disabled={!isReady || timeline.duration <= 0}
            max={timeline.duration || 0}
            min={0}
            onChange={(event) => {
              const currentTime = Number(event.target.value);
              if (isSeekingRef.current) {
                previewSeek(currentTime);
              } else {
                commitSeek(currentTime);
              }
            }}
            onPointerCancel={endSeek}
            onPointerDown={beginSeek}
            onPointerLeave={() => setHoveredTime(null)}
            onPointerMove={updateHoveredTime}
            onPointerUp={endSeek}
            step="0.1"
            style={{
              background: seekBarBackground,
            }}
            type="range"
            value={Math.min(timeline.currentTime, timeline.duration || 0)}
          />
          {hoveredTime != null ? (
            <span
              ref={hoverBadgeRef}
              className="pointer-events-none absolute bottom-[calc(100%+0.75rem)] rounded-full bg-black/30 px-2.5 py-1.5 text-sm tabular-nums text-white"
              style={{
                left: hoverBadgeLeft ?? `${hoveredProgress}%`,
                transform: "translateX(-50%)",
              }}
            >
              {formatTime(hoveredTime)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center justify-between pr-2">
            <div className="flex items-center gap-2">
              <button
                aria-label={showRemainingTime ? "Show elapsed time" : "Show remaining time"}
                className={timeButtonClassName}
                disabled={timeline.duration <= 0}
                onClick={() => setShowRemainingTime((value) => !value)}
                type="button"
              >
                <span aria-hidden className={controlHoverClassName} />
                <span className="relative">
                  {showRemainingTime
                    ? `-${formatTime(timeline.duration - timeline.currentTime)}`
                    : formatTime(timeline.currentTime)}{" "}
                  / {formatTime(timeline.duration)}
                </span>
              </button>
            </div>
            <button
              aria-label="Replay segment"
              className={controlButtonClassName}
              disabled={!isReady || !segment}
              onClick={replaySegment}
              type="button"
            >
              <span aria-hidden className={controlHoverClassName} />
              <ReplayIcon className="relative size-5" />
            </button>
          </div>
          <button
            aria-label={isPlaying ? "Pause" : "Play"}
            className={controlButtonClassName}
            disabled={!isReady}
            onClick={togglePlayback}
            type="button"
          >
            <span aria-hidden className={controlHoverClassName} />
            {isPlaying ? (
              <AudioPauseIcon className="relative size-7" />
            ) : (
              <AudioPlayIcon className="relative size-7" />
              )}
          </button>
          <div className="relative flex justify-end" ref={playbackRateControlRef}>
            {isPlaybackRateMenuOpen ? (
              <div
                aria-label="Playback speed"
                className="absolute bottom-[calc(100%+1.25rem)] right-0 z-20 flex w-[20.625rem] flex-col gap-2 rounded-lg bg-black/70 p-4"
                role="group"
              >
                <span
                  className="mb-6 text-center leading-none tabular-nums text-white"
                  style={{ fontSize: "18px", fontWeight: 500 }}
                >
                  {formatPlaybackRateWithTwoDecimals(playbackRate)}
                </span>
                <input
                  aria-label="Set playback speed"
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  max={2}
                  min={0.25}
                  onChange={(event) => changePlaybackRate(Number(event.target.value))}
                  step={0.05}
                  style={{
                    background: `linear-gradient(to right, #fff 0%, #fff ${playbackRateProgress}%, rgba(255,255,255,0.3) ${playbackRateProgress}%, rgba(255,255,255,0.3) 100%)`,
                  }}
                  type="range"
                  value={playbackRate}
                />
                <div className="mt-6 flex items-center gap-3">
                  {PLAYBACK_RATE_OPTIONS.map((rate) => (
                    <button
                      aria-pressed={playbackRate === rate}
                      className="relative h-8 w-[50px] shrink-0 cursor-pointer rounded-full bg-white/15 px-1 leading-none tabular-nums text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:[box-shadow:inset_0_0_0_9999px_rgba(255,255,255,0.15)]"
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      style={{ fontSize: "12px" }}
                      type="button"
                    >
                      {formatPlaybackRate(rate)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              aria-expanded={isPlaybackRateMenuOpen}
              aria-label="Playback speed"
              className={playbackRateButtonClassName}
              disabled={!isReady}
              onClick={() => setIsPlaybackRateMenuOpen((value) => !value)}
              type="button"
            >
              <span aria-hidden className={controlHoverClassName} />
                <span className="relative">{formatPlaybackRate(playbackRate)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
