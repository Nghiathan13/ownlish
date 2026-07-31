import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DictationCatalogVideo } from "@/entities/dictation/model/types";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { DictationSegmentNavigation } from "./DictationSegmentNavigation";

vi.mock("@tanstack/react-query", () => ({
  useQueries: () => [{ data: null }],
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-1" },
  }),
}));

vi.mock("@/entities/dictation/api", () => ({
  getDictationProgress: vi.fn(),
  getDictationThumbnailUrl: () => "https://example.com/thumbnail.jpg",
}));

const musicVideo: DictationCatalogVideo = {
  category: "Music",
  durationSeconds: 200,
  id: "music-1",
  language: "en",
  path: "music-1.json",
  segmentCount: 12,
  title: "Music video",
  youtubeVideoId: "music-video",
};

describe("DictationSegmentNavigation", () => {
  it("shows the music icon before the duration in a Music video card", () => {
    render(
      <LocaleProvider>
        <DictationSegmentNavigation
          activeSegmentId={null}
          activeVideoId={musicVideo.id}
          answeredSegmentIds={[]}
          disabled={false}
          isFollowVideoEnabled={false}
          onFollowVideoChange={vi.fn()}
          onSelect={vi.fn()}
          segments={[]}
          videos={[musicVideo]}
        />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Video" }));

    const durationBadge = screen.getByText("3:20");
    expect(durationBadge.parentElement?.querySelector("svg")).toBeInTheDocument();
  });
});
