import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { DictationCatalogVideo } from "@/entities/dictation-library";
import type { DictationProgress, DictationVideo } from "@/entities/dictation-study";
import { DictationStudyPage } from "./DictationStudyPage";

const mocks = vi.hoisted(() => ({
  rootUrl: "https://content.example/dictation/" as string | null,
  catalogQuery: {
    data: null as { catalog: { videos: DictationCatalogVideo[] } } | null,
    error: null as Error | null,
    isLoading: false,
  },
  videoQuery: {
    data: null as DictationVideo | null,
    error: null as Error | null,
    isLoading: false,
  },
  progressQuery: {
    data: null as DictationProgress | null,
    error: null as Error | null,
    isLoading: false,
  },
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
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
  getDictationCatalogRootUrl: () => mocks.rootUrl,
  useDictationCatalogQuery: () => mocks.catalogQuery,
}));

vi.mock("@/entities/dictation-study", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/dictation-study")>()),
  useDictationProgressQuery: () => mocks.progressQuery,
  useDictationVideoQuery: () => mocks.videoQuery,
}));

vi.mock("@/features/dictation-study", () => ({
  DictationStudy: ({
    backHref,
    video,
  }: {
    backHref: string;
    video: DictationVideo;
  }) => (
    <div>
      <span>{video.video.title}</span>
      <a href={backHref}>Back to library</a>
    </div>
  ),
}));

const catalogVideo: DictationCatalogVideo = {
  category: "Music",
  durationSeconds: 200,
  id: "music-1",
  language: "en",
  path: "videos/music-1.json",
  segmentCount: 12,
  title: "Music video",
  youtubeVideoId: "music-video",
};

const video: DictationVideo = {
  version: 1,
  status: "approved",
  timing: { granularity: "segment", source: "manual" },
  video: {
    category: "Music",
    durationSeconds: 200,
    language: "en",
    title: "Music video",
    url: "https://www.youtube.com/watch?v=music-video",
    youtubeVideoId: "music-video",
  },
  segments: [{ id: "s001", startMs: 0, endMs: 1000, text: "Hello world" }],
};

function renderPage(videoId = "music-1") {
  return render(
    <LocaleProvider>
      <DictationStudyPage videoId={videoId} />
    </LocaleProvider>,
  );
}

describe("DictationStudyPage", () => {
  beforeEach(() => {
    mocks.rootUrl = "https://content.example/dictation/";
    mocks.catalogQuery.data = { catalog: { videos: [catalogVideo] } };
    mocks.catalogQuery.error = null;
    mocks.catalogQuery.isLoading = false;
    mocks.videoQuery.data = video;
    mocks.videoQuery.error = null;
    mocks.videoQuery.isLoading = false;
    mocks.progressQuery.data = null;
    mocks.progressQuery.error = null;
    mocks.progressQuery.isLoading = false;
  });

  it("shows a loading skeleton while screen data is loading", () => {
    mocks.videoQuery.isLoading = true;
    mocks.videoQuery.data = null;

    renderPage();

    expect(document.querySelector(".grid")).toBeInTheDocument();
    expect(screen.queryByText("Music video")).not.toBeInTheDocument();
  });

  it("shows a not-found state when the lesson is missing", () => {
    mocks.videoQuery.data = null;
    mocks.videoQuery.error = new Error("missing");

    renderPage("missing");

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/dictation",
    );
    expect(
      screen.getByText(/this dictation lesson isn't available/i),
    ).toBeInTheDocument();
  });

  it("shows a progress error when progress cannot be loaded", () => {
    mocks.progressQuery.error = new Error("network");

    renderPage();

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/dictation/music",
    );
    expect(screen.getByText(/couldn't load your progress/i)).toBeInTheDocument();
  });

  it("composes the study session from the video document without a combined catalog", () => {
    renderPage();

    expect(screen.getByText("Music video")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to library" })).toHaveAttribute(
      "href",
      "/dictation/music",
    );
  });
});
