import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { DictationLibrary } from "./DictationLibrary";

vi.mock("@tanstack/react-query", () => ({
  useQueries: () => [{ data: null }],
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-1" },
  }),
}));

vi.mock("@/entities/dictation/model/useDictationCatalogQuery", () => ({
  useDictationCatalogQuery: () => ({
    data: {
      catalog: {
        videos: [
          {
            category: "Music",
            durationSeconds: 200,
            id: "music-1",
            language: "en",
            path: "music-1.json",
            segmentCount: 12,
            title: "Music video",
            youtubeVideoId: "music-video",
          },
        ],
      },
    },
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/entities/dictation/api", () => ({
  getDictationProgress: vi.fn(),
  getDictationThumbnailUrl: () => "https://example.com/thumbnail.jpg",
}));

describe("DictationLibrary", () => {
  it("shows the music icon immediately before a Music video duration badge", () => {
    render(
      <LocaleProvider>
        <DictationLibrary category="Music" />
      </LocaleProvider>,
    );

    const durationBadge = screen.getByText("3:20");

    expect(durationBadge.parentElement?.querySelector("svg")).toBeInTheDocument();
  });
});
