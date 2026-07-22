"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseAutoplayMediaAudioParams = {
  audioRef: RefObject<HTMLAudioElement | null>;
  src: string | null;
  enabled: boolean;
  onBlocked?: () => void;
};

export function useAutoplayMediaAudio({
  audioRef,
  src,
  enabled,
  onBlocked,
}: UseAutoplayMediaAudioParams) {
  const playedSrcRef = useRef<string | null>(null);
  const onBlockedRef = useRef(onBlocked);

  useEffect(() => {
    onBlockedRef.current = onBlocked;
  }, [onBlocked]);

  useEffect(() => {
    if (!enabled || !src) {
      return;
    }

    if (playedSrcRef.current === src) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    playedSrcRef.current = src;
    audio.currentTime = 0;

    void audio.play().catch(() => {
      onBlockedRef.current?.();
    });
  }, [audioRef, enabled, src]);
}
