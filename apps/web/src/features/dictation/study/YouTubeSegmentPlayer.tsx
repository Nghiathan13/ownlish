"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState?: () => number;
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
        onPlaybackRateChange?: (event: { data: number }) => void;
        onReady: () => void;
      };
      height: string;
      playerVars: Record<string, number | string>;
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

type YouTubeSegmentPlayerProps = {
  isTimeSyncEnabled: boolean;
  onPlaybackRateChange: (playbackRate: number) => void;
  onPlaybackStateChange: (isPlaying: boolean) => void;
  onSegmentEnd: () => void;
  onTimeChange: (timeline: { currentTime: number; duration: number }) => void;
  playbackCommand: { action: "pause" | "play"; id: number } | null;
  playbackRate: number;
  segmentEndMsRef: MutableRefObject<number | null>;
  seekRequest: { endMs: number; id: number; startSeconds: number } | null;
  timelineSeekRequest: { id: number; targetSeconds: number } | null;
  videoId: string;
};

let youtubeApiPromise: Promise<YouTubeApi> | null = null;
const SEEK_TOLERANCE_SECONDS = 0.25;
const SEGMENT_END_EARLY_PAUSE_TOLERANCE_MS = 100;
const SEGMENT_END_LATE_PAUSE_TOLERANCE_MS = 300;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.onerror = () => {
      youtubeApiPromise = null;
      reject(new Error("Cannot load YouTube player."));
    };
    script.src = "https://www.youtube.com/iframe_api";
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

export function YouTubeSegmentPlayer({
  seekRequest,
  isTimeSyncEnabled,
  onPlaybackRateChange,
  onPlaybackStateChange,
  onSegmentEnd,
  onTimeChange,
  playbackCommand,
  playbackRate,
  segmentEndMsRef,
  videoId,
  timelineSeekRequest,
}: YouTubeSegmentPlayerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const latestSeekRequestIdRef = useRef<number | null>(null);
  const playbackRateInitializedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    latestSeekRequestIdRef.current = seekRequest?.id ?? null;
  }, [seekRequest]);

  useEffect(() => {
    let disposed = false;
    playbackRateInitializedRef.current = false;

    void loadYouTubeApi()
      .then((youtube) => {
        if (disposed || !mountRef.current) return;

        playerRef.current = new youtube.Player(mountRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            controls: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onPlaybackRateChange: (event) => {
              if (playbackRateInitializedRef.current) {
                onPlaybackRateChange(event.data);
              }
            },
            onReady: () => setIsReady(true),
          },
        });
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      setIsReady(false);
    };
  }, [onPlaybackRateChange, videoId]);

  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    playbackRateInitializedRef.current = true;
    playerRef.current.setPlaybackRate(playbackRate);
  }, [isReady, playbackRate]);

  useEffect(() => {
    if (!playerRef.current || !isReady || !seekRequest) return;

    const player = playerRef.current;

    const { endMs, id, startSeconds } = seekRequest;
    let cancelled = false;

    function playAtRequestedPosition() {
      if (cancelled || latestSeekRequestIdRef.current !== id) return;

      window.clearInterval(confirmationTimer);
      segmentEndMsRef.current = endMs;
      player.playVideo();
    }

    segmentEndMsRef.current = null;
    player.pauseVideo();
    player.seekTo(startSeconds, true);
    const confirmationTimer = window.setInterval(() => {
      if (Math.abs(player.getCurrentTime() - startSeconds) <= SEEK_TOLERANCE_SECONDS) {
        playAtRequestedPosition();
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearInterval(confirmationTimer);
    };
  }, [isReady, seekRequest, segmentEndMsRef]);

  useEffect(() => {
    if (!playerRef.current || !isReady || !playbackCommand) return;

    if (playbackCommand.action === "pause") {
      playerRef.current.pauseVideo();
      return;
    }

    playerRef.current.playVideo();
  }, [isReady, playbackCommand]);

  useEffect(() => {
    if (!playerRef.current || !isReady || !timelineSeekRequest) return;

    playerRef.current.seekTo(timelineSeekRequest.targetSeconds, true);
  }, [isReady, timelineSeekRequest]);

  useEffect(() => {
    if (!playerRef.current || !isReady) return;

    function syncTime() {
      const player = playerRef.current;
      if (!player) return;

      const currentTime = player.getCurrentTime();
      const currentMs = currentTime * 1000;
      const endMs = segmentEndMsRef.current;
      if (endMs !== null) {
        if (
          currentMs >= endMs - SEGMENT_END_EARLY_PAUSE_TOLERANCE_MS &&
          currentMs <= endMs + SEGMENT_END_LATE_PAUSE_TOLERANCE_MS
        ) {
          segmentEndMsRef.current = null;
          player.pauseVideo();
          onSegmentEnd();
        } else if (currentMs > endMs + SEGMENT_END_LATE_PAUSE_TOLERANCE_MS) {
          segmentEndMsRef.current = null;
          onSegmentEnd();
        }
      }

      if (isTimeSyncEnabled) {
        onPlaybackStateChange(player.getPlayerState?.() === 1);
        onTimeChange({
          currentTime,
          duration: player.getDuration(),
        });
      }
    }

    syncTime();
    const timerDelay = Math.min(200, Math.max(20, 100 / playbackRate));
    const timer = window.setInterval(syncTime, timerDelay);

    return () => window.clearInterval(timer);
  }, [
    isReady,
    isTimeSyncEnabled,
    onPlaybackStateChange,
    onSegmentEnd,
    onTimeChange,
    playbackRate,
    segmentEndMsRef,
  ]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div className="h-full w-full" ref={mountRef} />
    </div>
  );
}
