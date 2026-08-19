import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type {
  DictationCatalogIndexCategory,
  DictationCatalogVideo,
} from "@/entities/dictation-library";
import { DictationLibraryPage } from "./DictationLibraryPage";

const mocks = vi.hoisted(() => ({
  indexQuery: {
    data: null as { index: { categories: DictationCatalogIndexCategory[] } } | null,
    error: null as Error | null,
    isLoading: false,
    refetch: vi.fn(),
  },
  catalogQuery: {
    data: null as { catalog: { videos: DictationCatalogVideo[] } } | null,
    error: null as Error | null,
    isLoading: false,
    refetch: vi.fn(),
  },
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/entities/dictation-library", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/dictation-library")>()),
  useDictationCatalogIndexQuery: () => mocks.indexQuery,
  useDictationCatalogQuery: () => mocks.catalogQuery,
}));

vi.mock("@/features/dictation-library", () => ({
  DictationLibrary: ({ videos }: { videos: DictationCatalogVideo[] }) => (
    <div>
      {videos.map((video) => (
        <a href={`/dictation/${video.id}`} key={video.id}>
          {video.title}
        </a>
      ))}
    </div>
  ),
}));

const categories: DictationCatalogIndexCategory[] = [
  { id: "bbc", label: "BBC", path: "catalogs/bbc.json" },
  { id: "music", label: "Music", path: "catalogs/music.json" },
];

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

function renderPage(categoryId?: string) {
  return render(
    <LocaleProvider>
      <DictationLibraryPage categoryId={categoryId} />
    </LocaleProvider>,
  );
}

describe("DictationLibraryPage", () => {
  beforeEach(() => {
    mocks.indexQuery.data = { index: { categories } };
    mocks.indexQuery.error = null;
    mocks.indexQuery.isLoading = false;
    mocks.indexQuery.refetch.mockReset();
    mocks.catalogQuery.data = { catalog: { videos: musicVideos } };
    mocks.catalogQuery.error = null;
    mocks.catalogQuery.isLoading = false;
    mocks.catalogQuery.refetch.mockReset();
    mocks.replace.mockReset();
  });

  it("shows loading placeholders while the catalog is loading", () => {
    mocks.catalogQuery.isLoading = true;

    renderPage("music");

    expect(document.querySelector(".grid")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows a retry action when the catalog cannot be loaded", () => {
    mocks.catalogQuery.data = null;
    mocks.catalogQuery.error = new Error("network");

    renderPage("music");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText(/couldn't load dictation lessons/i)).toBeInTheDocument();
    expect(mocks.catalogQuery.refetch).toHaveBeenCalledOnce();
  });

  it("redirects /dictation to the first category from the index", () => {
    renderPage();

    expect(mocks.replace).toHaveBeenCalledWith("/dictation/bbc");
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
