import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeDashboard } from "@/features/home/components/HomeDashboard";
import { getVietnamDateKey } from "@/features/home/lib/learningActivityCalendar";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useCollectionsListQuery: vi.fn(),
  useDifficultReviewWords: vi.fn(),
  useLearningActivityCalendar: vi.fn(),
  useOxfordProgressSummary: vi.fn(),
  useVocabStats: vi.fn(),
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

describe("HomeDashboard", () => {
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

  it("keeps the guest home body empty", () => {
    mocks.useAuthSession.mockReturnValue({ status: "guest", user: null });

    render(<HomeDashboard />);

    expect(
      screen.queryByText("Build your English with a clear daily routine."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("shows all learning activity with Review selected by default", () => {
    render(<HomeDashboard />);

    expect(screen.getByText("Current streak").parentElement).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("minutes")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Study activity" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1–15 minutes")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Vocabulary" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "TOEIC" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Practice" })).toBeInTheDocument();
    expect(screen.getByText("Difficult words")).toBeInTheDocument();
  });

  it("shows collection and Oxford entry progress for Review", async () => {
    const user = userEvent.setup();

    render(<HomeDashboard />);

    expect(screen.getByRole("tab", { name: "My Collection" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Daily vocabulary" })).toBeInTheDocument();
    expect(screen.getByText("Mastered")).toBeInTheDocument();
    expect(screen.getByText("Learning")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Difficult words")).toBeInTheDocument();
    expect(screen.getByText("difficult")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show levels" })).toBeInTheDocument();
    expect(mocks.useVocabStats).toHaveBeenLastCalledWith(
      expect.objectContaining({ collectionId: "all", enabled: true }),
    );

    await user.click(screen.getByRole("button", { name: "Daily vocabulary" }));

    expect(mocks.useVocabStats).toHaveBeenLastCalledWith(
      expect.objectContaining({ collectionId: "collection-1", enabled: true }),
    );

    await user.click(screen.getByRole("tab", { name: "Oxford" }));

    expect(mocks.useOxfordProgressSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ band: "all", enabled: true }),
    );
    expect(screen.getByRole("button", { name: "A1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C1" })).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "A2" }));

    expect(mocks.useOxfordProgressSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ band: "A2", enabled: true }),
    );

    await user.click(screen.getByRole("button", { name: "Show levels" }));

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
    render(<HomeDashboard />);

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

    render(<HomeDashboard />);

    expect(
      screen.getByText("We couldn't load your collections."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reloadCollections).toHaveBeenCalledTimes(1);
  });
});
