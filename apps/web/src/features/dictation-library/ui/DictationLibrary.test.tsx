import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { DictationCatalogVideo } from "@/entities/dictation-library";
import { DictationLibrary } from "./DictationLibrary";

const mocks = vi.hoisted(() => ({
  progressQueries: [] as Array<{ data: unknown }>,
}));

vi.mock("@/entities/session", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-1" },
  }),
}));

vi.mock("@/entities/dictation-library", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/dictation-library")>()),
  getDictationThumbnailUrl: () => "https://example.com/thumbnail.jpg",
}));

vi.mock("@/entities/dictation-study", () => ({
  useDictationProgressQueries: () => mocks.progressQueries,
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

const bbcVideo: DictationCatalogVideo = {
  category: "BBC",
  durationSeconds: 65,
  id: "bbc-1",
  language: "en",
  path: "bbc-1.json",
  segmentCount: 4,
  title: "BBC video",
  youtubeVideoId: "bbc-video",
};

function renderLibrary(videos: DictationCatalogVideo[]) {
  return render(
    <LocaleProvider>
      <DictationLibrary videos={videos} />
    </LocaleProvider>,
  );
}

describe("DictationLibrary", () => {
  beforeEach(() => {
    mocks.progressQueries = [{ data: null }];
  });

  it("renders not-started progress and a study link for each video", () => {
    renderLibrary([musicVideo]);

    expect(screen.getByRole("link", { name: /Music video/i })).toHaveAttribute(
      "href",
      "/dictation/watch?v=music-1",
    );
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getByText("12 segments")).toBeInTheDocument();
  });

  it("renders completed progress and the Music icon beside the duration badge", () => {
    mocks.progressQueries = [
      {
        data: {
          answeredSegmentIds: ["s001", "s002"],
          completedAt: "2026-01-01T00:00:00.000Z",
          correctCount: 10,
        },
      },
    ];

    renderLibrary([musicVideo]);

    const durationBadge = screen.getByText("3:20");
    expect(durationBadge.parentElement?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Completed: 10/12")).toBeInTheDocument();
  });

  it("renders in-progress counts without a music icon for non-music videos", () => {
    mocks.progressQueries = [
      {
        data: {
          answeredSegmentIds: ["s001", "s002"],
          completedAt: null,
          correctCount: 1,
        },
      },
    ];

    renderLibrary([bbcVideo]);

    const durationBadge = screen.getByText("1:05");
    expect(durationBadge.parentElement?.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.getByText("Progress: 2/4")).toBeInTheDocument();
  });
});
