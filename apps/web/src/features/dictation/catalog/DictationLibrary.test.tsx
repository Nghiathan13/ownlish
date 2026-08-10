import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/providers/LocaleProvider";
import { DictationLibrary } from "./DictationLibrary";

const mocks = vi.hoisted(() => ({
  catalogQuery: {
    data: null as { catalog: { videos: Array<Record<string, unknown>> } } | null,
    error: null as Error | null,
    isLoading: false,
    refetch: vi.fn(),
  },
  progressQueries: [] as Array<{ data: unknown }>,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueries: () => mocks.progressQueries,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  useAuthSession: () => ({
    status: "authenticated",
    user: { id: "user-1" },
  }),
}));

vi.mock("@/entities/dictation/model/useDictationCatalogQuery", () => ({
  useDictationCatalogQuery: () => mocks.catalogQuery,
}));

vi.mock("@/entities/dictation/api", () => ({
  getDictationProgress: vi.fn(),
  getDictationThumbnailUrl: () => "https://example.com/thumbnail.jpg",
}));

function renderLibrary(category?: string) {
  return render(
    <LocaleProvider>
      <DictationLibrary category={category} />
    </LocaleProvider>,
  );
}

describe("DictationLibrary", () => {
  beforeEach(() => {
    mocks.catalogQuery.data = {
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
          {
            category: "BBC",
            durationSeconds: 65,
            id: "bbc-1",
            language: "en",
            path: "bbc-1.json",
            segmentCount: 4,
            title: "BBC video",
            youtubeVideoId: "bbc-video",
          },
        ],
      },
    };
    mocks.catalogQuery.error = null;
    mocks.catalogQuery.isLoading = false;
    mocks.catalogQuery.refetch.mockReset();
    mocks.progressQueries = [{ data: null }];
  });

  it("shows loading placeholders while the catalog is loading", () => {
    mocks.catalogQuery.isLoading = true;

    renderLibrary();

    expect(document.querySelector(".grid")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows a retry action when the catalog cannot be loaded", () => {
    mocks.catalogQuery.data = null;
    mocks.catalogQuery.error = new Error("network");

    renderLibrary();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText(/couldn't load dictation lessons/i)).toBeInTheDocument();
    expect(mocks.catalogQuery.refetch).toHaveBeenCalledOnce();
  });

  it("defaults to the first available category and renders its not-started progress", () => {
    renderLibrary();

    expect(screen.getByRole("tab", { name: "Music" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: /Music video/i })).toHaveAttribute(
      "href",
      "/dictation/music-1",
    );
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.queryByText("BBC video")).not.toBeInTheDocument();
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

    renderLibrary("Music");

    const durationBadge = screen.getByText("3:20");
    expect(durationBadge.parentElement?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Completed: 10/12")).toBeInTheDocument();
  });

  it("selects a valid requested category and renders in-progress counts", () => {
    mocks.progressQueries = [
      {
        data: {
          answeredSegmentIds: ["s001", "s002"],
          completedAt: null,
          correctCount: 1,
        },
      },
    ];

    renderLibrary("BBC");

    expect(screen.getByRole("tab", { name: "BBC" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Progress: 2/4")).toBeInTheDocument();
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });
});
