// @vitest-environment jsdom

import { createRef } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAutoplayMediaAudio } from "./useAutoplayMediaAudio";

function createAudioElement() {
  const audio = document.createElement("audio");
  audio.play = vi.fn().mockResolvedValue(undefined);
  return audio;
}

describe("useAutoplayMediaAudio", () => {
  it("plays when src changes", async () => {
    const audio = createAudioElement();
    const audioRef = createRef<HTMLAudioElement>();
    audioRef.current = audio;

    const { rerender } = renderHook(
      ({ src, enabled }: { src: string | null; enabled: boolean }) =>
        useAutoplayMediaAudio({
          audioRef,
          src,
          enabled,
        }),
      {
        initialProps: { src: "https://example.com/a.mp3", enabled: true },
      },
    );

    await waitFor(() => {
      expect(audio.play).toHaveBeenCalledTimes(1);
    });
    expect(audio.currentTime).toBe(0);

    rerender({ src: "https://example.com/b.mp3", enabled: true });

    await waitFor(() => {
      expect(audio.play).toHaveBeenCalledTimes(2);
    });
  });

  it("skips when disabled", () => {
    const audio = createAudioElement();
    const audioRef = createRef<HTMLAudioElement>();
    audioRef.current = audio;

    renderHook(() =>
      useAutoplayMediaAudio({
        audioRef,
        src: "https://example.com/a.mp3",
        enabled: false,
      }),
    );

    expect(audio.play).not.toHaveBeenCalled();
  });

  it("calls onBlocked on play rejection", async () => {
    const audio = createAudioElement();
    audio.play = vi.fn().mockRejectedValue(new Error("NotAllowedError"));
    const audioRef = createRef<HTMLAudioElement>();
    audioRef.current = audio;
    const onBlocked = vi.fn();

    renderHook(() =>
      useAutoplayMediaAudio({
        audioRef,
        src: "https://example.com/a.mp3",
        enabled: true,
        onBlocked,
      }),
    );

    await waitFor(() => {
      expect(onBlocked).toHaveBeenCalledTimes(1);
    });
  });
});
