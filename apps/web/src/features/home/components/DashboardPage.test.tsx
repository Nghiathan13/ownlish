import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/features/home/components/DashboardPage";
import { getVietnamDateKey } from "@/features/home/lib/learningActivityCalendar";

function renderDashboard(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useCollectionsListQuery: vi.fn(),
  useDifficultReviewWords: vi.fn(),
  useLearningActivityCalendar: vi.fn(),
  useOxfordProgressSummary: vi.fn(),
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useVocabStats: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useRouter: mocks.useRouter,
}));

vi.mock("@/features/auth/hooks/useAuthSession", () => ({
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  isLoadingStatus: (status: string) => status === "loading",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/features/collections/shared/data/hooks", () => ({
  useCollectionsListQuery: mocks.useCollectionsListQuery,
}));

vi.mock("@/features/home/hooks/useLearningActivityCalendar", () => ({
  useLearningActivityCalendar: mocks.useLearningActivityCalendar,
}));

vi.mock("@/features/home/hooks/useDifficultReviewWords", () => ({
  useDifficultReviewWords: mocks.useDifficultReviewWords,
}));

vi.mock("@/features/home/hooks/useVocabStats", () => ({
  useVocabStats: mocks.useVocabStats,
}));

vi.mock("@/features/home/hooks/useOxfordProgressSummary", () => ({
  useOxfordProgressSummary: mocks.useOxfordProgressSummary,
}));

vi.mock("@/shared/providers/ThemeProvider", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
  useResolvedTheme: () => "light",
}));

vi.mock("@/shared/providers/LocaleProvider", async () => {
  const { translate } = await import("@/shared/i18n/messages");

  return {
    LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
    useLocale: () => ({
      locale: "en" as const,
      setLocale: vi.fn(),
      t: (key: Parameters<typeof translate>[1]) => translate("en", key),
    }),
    useT: () => (key: Parameters<typeof translate>[1]) => translate("en", key),
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

describe("DashboardPage", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/dashboard/progress");
    mocks.useRouter.mockReturnValue({ replace: vi.fn() });
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
    mocks.useLearningActivityCalendar.mockReturnValue({
      calendar: {
        days: [
          {
            activityType: "TEST_PRACTICE",
            learnedOn: getVietnamDateKey(),
            seconds: 125,
          },
        ],
      },
      isLoading: false,
    });
  });

  it("shows activity metrics on the activity section", () => {
    mocks.usePathname.mockReturnValue("/dashboard/my-activity");
    renderDashboard(<DashboardPage section="activity" />);

    expect(screen.getByRole("tab", { name: "My activity" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Progress" })).toHaveAttribute(
      "href",
      "/dashboard/progress",
    );
    expect(screen.getByText("Current streak").parentElement).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("minutes")).toBeInTheDocument();
    expect(screen.getByText("1–15 minutes")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Review" })).not.toBeInTheDocument();
    expect(screen.queryByText("Difficult words")).not.toBeInTheDocument();
  });

  it("shows progress modes with Review selected by default", () => {
    renderDashboard(<DashboardPage section="progress" />);

    expect(screen.getByRole("tab", { name: "Progress" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByText("Difficult words")).toBeInTheDocument();
    expect(screen.queryByText("Current streak")).not.toBeInTheDocument();
  });

  it("shows collection and Oxford entry progress for Review", async () => {
    const user = userEvent.setup();

    renderDashboard(<DashboardPage section="progress" />);

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
    // Restore full selection so progress stays on the single "all" query mock.
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
    renderDashboard(<DashboardPage section="progress" />);

    expect(document.body).not.toHaveTextContent(/NaN|Infinity/);
  });

  it("surfaces collection loading failures instead of rendering a blank page", async () => {
    const user = userEvent.setup();
    const reloadCollections = vi.fn();
    mocks.useCollectionsListQuery.mockReturnValue({
      collections: [],
      collectionsError: "Cannot connect to server.",
      isLoadingCollections: false,
      reloadCollections,
    });

    renderDashboard(<DashboardPage section="activity" />);

    expect(
      screen.getByText("We couldn't load your collections."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reloadCollections).toHaveBeenCalledTimes(1);
  });
});
