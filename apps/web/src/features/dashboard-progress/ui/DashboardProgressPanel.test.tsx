import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardProgressPanel } from "./DashboardProgressPanel";

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardProgressPanel />
    </QueryClientProvider>,
  );
}

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useCollectionsListQuery: vi.fn(),
  useDifficultReviewWords: vi.fn(),
  useOxfordProgressSummary: vi.fn(),
  useVocabStats: vi.fn(),
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/entities/collection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/collection")>()),
  useCollectionsListQuery: mocks.useCollectionsListQuery,
}));

vi.mock("../model/useDifficultReviewWords", () => ({
  useDifficultReviewWords: mocks.useDifficultReviewWords,
}));

vi.mock("@/entities/vocab", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/vocab")>()),
  useVocabStats: mocks.useVocabStats,
}));

vi.mock("../model/useOxfordProgressSummary", () => ({
  useOxfordProgressSummary: mocks.useOxfordProgressSummary,
}));

vi.mock("@/shared/lib/providers", async () => {
  const { translate } = await import("@/shared/i18n");

  return {
    LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
    useLocale: () => ({
      locale: "en" as const,
      setLocale: vi.fn(),
      t: (key: Parameters<typeof translate>[1]) => translate("en", key),
    }),
    useResolvedTheme: () => "light",
    useT: () => (key: Parameters<typeof translate>[1]) => translate("en", key),
    useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
  };
});

const defaultCollection = {
  id: "collection-1",
  name: "Daily vocabulary",
  description: null,
  kind: "USER",
  source: null,
  cefrLevel: null,
  isDefault: true,
  isPublic: false,
  itemCount: 20,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("DashboardProgressPanel", () => {
  beforeEach(() => {
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: "user-1",
        email: "linh@example.com",
        name: "Linh Nguyen",
        role: "USER",
      },
    });
    mocks.useCollectionsListQuery.mockReturnValue({
      collections: [defaultCollection],
      collectionsError: null,
      isLoadingCollections: false,
      reloadCollections: vi.fn(),
    });
    mocks.useVocabStats.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      stats: {
        total: 20,
        due: 4,
        mastered: 8,
        highWrongCount: 3,
        levels: [
          { level: 0, count: 4 },
          { level: 1, count: 8 },
          { level: 7, count: 8 },
        ],
      },
    });
    mocks.useOxfordProgressSummary.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      summary: {
        total: 20,
        masteredCount: 5,
        learningCount: 5,
        newCount: 10,
        levelCounts: Array.from({ length: 7 }, (_, index) => ({
          level: index + 1,
          count: index === 0 ? 5 : index === 6 ? 5 : 0,
        })),
      },
    });
    mocks.useDifficultReviewWords.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      words: [
        {
          word: "difficult",
          collectionName: "My Vocabulary",
          wrongCount: 4,
        },
      ],
    });
  });

  it("shows progress modes with Review selected by default", () => {
    renderPanel();

    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByText("Difficult words")).toBeInTheDocument();
  });

  it("shows collection and Oxford entry progress for Review", async () => {
    const user = userEvent.setup();

    renderPanel();

    expect(screen.getByText("My Collection")).toBeInTheDocument();
    expect(screen.getByText("Collection progress")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch progress source" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter collections" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mastered")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Difficult words")).toBeInTheDocument();
    expect(screen.getByText("difficult")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch to levels chart" }),
    ).toBeInTheDocument();
    expect(mocks.useVocabStats).toHaveBeenLastCalledWith(
      expect.objectContaining({ collectionId: "all", enabled: true }),
    );

    await user.click(screen.getByRole("button", { name: "Filter collections" }));
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Daily vocabulary" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Daily vocabulary" }),
    );
    expect(screen.getByText("Total").parentElement).toHaveTextContent("0");

    await user.click(
      screen.getByRole("button", { name: "Switch progress source" }),
    );
    await user.click(screen.getByRole("menuitemradio", { name: "Oxford" }));

    expect(mocks.useOxfordProgressSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ band: "all", enabled: true }),
    );
    expect(
      screen.getByRole("button", { name: "Filter bands" }),
    ).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filter bands" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "A1" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "C1" })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitemcheckbox", { name: "A2" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "A2" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await user.click(screen.getByRole("menuitemcheckbox", { name: "A2" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "A2" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to levels chart" }),
    );

    expect(screen.getByText("Level 0")).toBeInTheDocument();
    expect(screen.getByText("Level 7")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Practice" }));

    expect(screen.queryByText("Difficult words")).not.toBeInTheDocument();
  });

  it("renders zero-valued metrics without invalid progress", () => {
    mocks.useVocabStats.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      stats: {
        total: 0,
        due: 0,
        mastered: 0,
        highWrongCount: 0,
        levels: [],
      },
    });
    renderPanel();

    expect(document.body).not.toHaveTextContent(/NaN|Infinity/);
  });
});
