"use client";

import { useEffect, useId, useRef, useState } from "react";
import { classNames } from "@/shared/lib/classNames";
import { AudioForwardIcon } from "@/shared/ui/icons/AudioForwardIcon";
import { AudioPauseIcon } from "@/shared/ui/icons/AudioPauseIcon";
import { AudioPlayIcon } from "@/shared/ui/icons/AudioPlayIcon";
import { AudioReplayIcon } from "@/shared/ui/icons/AudioReplayIcon";
import { AutoplayIcon } from "@/shared/ui/icons/AutoplayIcon";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

type AudioPlayerProps = {
  autoPlayStorageKey?: string;
  bordered?: boolean;
  elevated?: boolean;
  onError?: () => void;
  src: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const seconds = Math.floor(value);
  const minutes = Math.floor(seconds / 60);

  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function readAutoplayPreference(storageKey: string | undefined) {
  if (!storageKey) {
    return false;
  }

  if (typeof window === "undefined") {
    return true;
  }

  return window.localStorage.getItem(storageKey) !== "false";
}

export function AudioPlayer({
  autoPlayStorageKey,
  bordered = false,
  elevated = true,
  onError,
  src,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const autoPlayedSrcRef = useRef<string | null>(null);
  const [autoplay, setAutoplay] = useState(() =>
    readAutoplayPreference(autoPlayStorageKey),
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<(typeof PLAYBACK_RATES)[number]>(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const speedMenuId = useId();

  useEffect(() => {
    if (!speedMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!playerRef.current?.contains(event.target as Node)) {
        setSpeedMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSpeedMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [speedMenuOpen]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (
      !autoPlayStorageKey ||
      !autoplay ||
      autoPlayedSrcRef.current === src ||
      !audioRef.current
    ) {
      return;
    }

    autoPlayedSrcRef.current = src;
    const playPromise = audioRef.current.play();

    if (playPromise) {
      void playPromise.catch(() => onError?.());
    }
  }, [autoPlayStorageKey, autoplay, onError, src]);

  function updateDuration() {
    const audio = audioRef.current;
    const nextDuration = audio?.duration ?? 0;

    setCurrentTime(audio?.currentTime ?? 0);
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
  }

  function seek(nextTime: number) {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const clampedTime = Math.min(Math.max(nextTime, 0), duration);
    audio.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }

  function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    const playPromise = audio.play();

    if (playPromise) {
      void playPromise.catch(() => onError?.());
    }
  }

  function toggleAutoplay() {
    setAutoplay((current) => {
      const next = !current;
      if (autoPlayStorageKey) {
        window.localStorage.setItem(autoPlayStorageKey, String(next));
      }
      return next;
    });
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const iconButtonClassName =
    "flex size-8 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-hover-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <div
      className={classNames(
        "rounded-xl bg-surface p-3",
        bordered && "border border-border",
        elevated && "shadow-card dark:border dark:border-border",
      )}
      ref={playerRef}
    >
      <audio
        hidden
        key={src}
        onDurationChange={updateDuration}
        onEnded={() => setIsPlaying(false)}
        onError={onError}
        onLoadedMetadata={updateDuration}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        preload="metadata"
        ref={audioRef}
        src={src}
      />

      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <input
        aria-label="Audio progress"
        className="mt-1 block h-1 w-full cursor-pointer appearance-none rounded-full bg-background accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary hover:[&::-moz-range-thumb]:size-3 hover:[&::-webkit-slider-thumb]:size-3 [&::-moz-range-thumb]:size-2 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:size-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        max={duration || 0}
        min="0"
        onChange={(event) => seek(Number(event.target.value))}
        style={{
          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) max(0px, calc(${progress}% - 24px)), color-mix(in srgb, var(--primary) 58%, var(--background)) ${progress}%, var(--background) ${progress}%)`,
        }}
        step="0.1"
        type="range"
        value={Math.min(currentTime, duration || 0)}
      />

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-1">
        {autoPlayStorageKey ? (
          <button
            aria-pressed={autoplay}
            className={classNames(
              "flex h-8 w-fit cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-medium hover:bg-hover-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              autoplay ? "text-primary" : "text-muted-foreground",
            )}
            onClick={toggleAutoplay}
            type="button"
          >
            <AutoplayIcon className="size-6" />
            Auto
          </button>
        ) : (
          <span aria-hidden />
        )}

        <button
          aria-label="Back 5 seconds"
          className={iconButtonClassName}
          onClick={() => seek(currentTime - 5)}
          type="button"
        >
          <AudioReplayIcon className="size-6" />
        </button>

        <button
          aria-label={isPlaying ? "Pause" : "Play"}
          className={iconButtonClassName}
          onClick={togglePlayback}
          type="button"
        >
          {isPlaying ? (
            <AudioPauseIcon className="size-6" />
          ) : (
            <AudioPlayIcon className="size-6" />
          )}
        </button>

        <button
          aria-label="Forward 5 seconds"
          className={iconButtonClassName}
          onClick={() => seek(currentTime + 5)}
          type="button"
        >
          <AudioForwardIcon className="size-6" />
        </button>

        <div className="relative justify-self-end">
          <button
            aria-controls={speedMenuId}
            aria-expanded={speedMenuOpen}
            aria-haspopup="listbox"
            aria-label={`Playback speed: ${playbackRate}x`}
            className="h-8 cursor-pointer rounded-lg px-2 text-xs font-medium tabular-nums hover:bg-hover-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setSpeedMenuOpen((current) => !current)}
            type="button"
          >
            {playbackRate}x
          </button>

          {speedMenuOpen ? (
            <div
              className="absolute top-[calc(100%+0.5rem)] right-0 z-20 grid min-w-16 gap-1 rounded-lg bg-surface p-1 shadow-card dark:border dark:border-border"
              id={speedMenuId}
              role="listbox"
            >
              {PLAYBACK_RATES.map((rate) => (
                <button
                  aria-selected={playbackRate === rate}
                  className={classNames(
                    "cursor-pointer rounded-lg px-2 py-1.5 text-sm tabular-nums hover:bg-hover-overlay",
                    playbackRate === rate && "bg-muted",
                  )}
                  key={rate}
                  onClick={() => {
                    setPlaybackRate(rate);
                    setSpeedMenuOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  {rate}x
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
