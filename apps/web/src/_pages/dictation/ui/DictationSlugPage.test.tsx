import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { DictationCatalogIndexCategory } from "@/entities/dictation-library";
import { DictationSlugPage } from "./DictationSlugPage";

const mocks = vi.hoisted(() => ({
  indexQuery: {
    data: null as { index: { categories: DictationCatalogIndexCategory[] } } | null,
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
  useDictationCatalogIndexQuery: () => mocks.indexQuery,
}));

vi.mock("./DictationLibraryPage", () => ({
  DictationLibraryPage: ({ categoryId }: { categoryId: string }) => (
    <div>Library {categoryId}</div>
  ),
}));

vi.mock("./DictationStudyPage", () => ({
  DictationStudyPage: ({ videoId }: { videoId: string }) => (
    <div>Study {videoId}</div>
  ),
}));

describe("DictationSlugPage", () => {
  beforeEach(() => {
    mocks.indexQuery.data = {
      index: {
        categories: [
          { id: "bbc", label: "BBC", path: "catalogs/bbc.json" },
          { id: "music", label: "Music", path: "catalogs/music.json" },
        ],
      },
    };
    mocks.indexQuery.error = null;
    mocks.indexQuery.isLoading = false;
    mocks.indexQuery.refetch.mockReset();
  });

  it("opens the library when the slug is a category id", () => {
    render(
      <LocaleProvider>
        <DictationSlugPage slug="music" />
      </LocaleProvider>,
    );

    expect(screen.getByText("Library music")).toBeInTheDocument();
  });

  it("opens a study session when the slug is not a category id", () => {
    render(
      <LocaleProvider>
        <DictationSlugPage slug="7BIp53who2A" />
      </LocaleProvider>,
    );

    expect(screen.getByText("Study 7BIp53who2A")).toBeInTheDocument();
  });
});
