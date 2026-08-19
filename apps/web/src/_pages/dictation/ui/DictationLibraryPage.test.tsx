import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { DictationCatalogVideo } from "@/entities/dictation-library";
import { DictationLibraryPage } from "./DictationLibraryPage";

const mocks = vi.hoisted(() => ({
  catalogQuery: {
    data: null as { catalog: { videos: DictationCatalogVideo[] } } | null,
    error: null as Error | null,
    isLoading: false,
    refetch: vi.fn(),
  },
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/entities/dictation-library", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/dictation-library")>()),
  useDictationCatalogQuery: () => mocks.catalogQuery,
}));

vi.mock("@/features/dictation-library", () => ({
  DictationLibrary: ({ videos }: { videos: DictationCatalogVideo[] }) => (
    <div>
      {videos.map((video) => (
        <a href={`/dictation/watch?v=${video.id}`} key={video.id}>
          {video.title}
        </a>
      ))}
    </div>
  ),
}));

const musicVideos: DictationCatalogVideo[] = [
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
];

function renderPage(categoryId: "bbc" | "music" = "music") {
  return render(
    <LocaleProvider>
      <DictationLibraryPage categoryId={categoryId} />
    </LocaleProvider>,
  );
}

describe("DictationLibraryPage", () => {
  beforeEach(() => {
    mocks.catalogQuery.data = { catalog: { videos: musicVideos } };
    mocks.catalogQuery.error = null;
    mocks.catalogQuery.isLoading = false;
    mocks.catalogQuery.refetch.mockReset();
  });

  it("keeps category tabs while the catalog body is loading", () => {
    mocks.catalogQuery.isLoading = true;

    renderPage("music");

    expect(screen.getByRole("tab", { name: "Music" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "BBC" })).toHaveAttribute(
      "href",
      "/dictation/bbc",
    );
    expect(document.querySelector(".grid")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Music video/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a retry action when the catalog cannot be loaded", () => {
    mocks.catalogQuery.data = null;
    mocks.catalogQuery.error = new Error("network");

    renderPage("music");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByRole("tab", { name: "Music" })).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't load dictation lessons/i),
    ).toBeInTheDocument();
    expect(mocks.catalogQuery.refetch).toHaveBeenCalledOnce();
  });

  it("composes the requested category catalog", () => {
    renderPage("music");

    expect(screen.getByRole("tab", { name: "Music" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("link", { name: /Music video/i })).toBeInTheDocument();
  });
});
