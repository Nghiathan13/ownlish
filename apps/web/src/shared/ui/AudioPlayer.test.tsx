import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "./AudioPlayer";

const AUTO_PLAY_STORAGE_KEY = "engvocab.tests.audio.autoplay";

describe("AudioPlayer", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("seeks when the progress bar changes", () => {
    render(<AudioPlayer onError={vi.fn()} src="/audio.mp3" />);

    const audio = document.querySelector("audio") as HTMLAudioElement;
    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 120,
    });
    fireEvent.loadedMetadata(audio);

    fireEvent.change(screen.getByRole("slider", { name: "Audio progress" }), {
      target: { value: "30" },
    });

    expect(audio.currentTime).toBe(30);
    expect(screen.getByText("0:30")).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("persists the autoplay preference", () => {
    render(
      <AudioPlayer
        autoPlayStorageKey={AUTO_PLAY_STORAGE_KEY}
        onError={vi.fn()}
        src="/audio.mp3"
      />,
    );

    const autoButton = screen.getByRole("button", { name: "Auto" });
    expect(autoButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(autoButton);

    expect(autoButton).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem(AUTO_PLAY_STORAGE_KEY)).toBe("false");
  });

  it("changes playback speed from its dropdown", async () => {
    render(<AudioPlayer onError={vi.fn()} src="/audio.mp3" />);

    fireEvent.click(screen.getByRole("button", { name: "Playback speed: 1x" }));
    fireEvent.click(screen.getByRole("option", { name: "1.5x" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Playback speed: 1.5x" })).toBeInTheDocument();
    });
    expect((document.querySelector("audio") as HTMLAudioElement).playbackRate).toBe(1.5);
  });
});
