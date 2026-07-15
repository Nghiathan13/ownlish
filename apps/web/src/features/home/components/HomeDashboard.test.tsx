import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeDashboard } from "@/features/home/components/HomeDashboard";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useCollectionsListQuery: vi.fn(),
  useDashboardPartPractice: vi.fn(),
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

vi.mock("@/features/home/hooks/useDashboardPartPractice", () => ({
  useDashboardPartPractice: mocks.useDashboardPartPractice,
}));

vi.mock("@/features/home/hooks/useVocabStats", () => ({
  useVocabStats: mocks.useVocabStats,
}));

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
        levels: [],
      },
    });
    mocks.useDashboardPartPractice.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      summaries: [
        { partNumber: 1, total: 20, answered: 10, correct: 8, wrong: 2 },
        { partNumber: 3, total: 20, answered: 4, correct: 1, wrong: 3 },
      ],
    });
  });

  it("offers sign in to a guest", () => {
    mocks.useAuthSession.mockReturnValue({ status: "guest", user: null });

    render(<HomeDashboard />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("shows vocabulary metrics and graded progress for all TOEIC parts", () => {
    render(<HomeDashboard />);

    expect(screen.getByRole("heading", { name: "Vocabulary" })).toBeInTheDocument();
    expect(screen.getByText("Due for review")).toBeInTheDocument();
    expect(screen.getByText("Mastered")).toBeInTheDocument();
    expect(screen.getByText("Difficult")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TOEIC" })).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("8/10 (80%)")).toBeInTheDocument();
    expect(screen.getByText("1/4 (25%)")).toBeInTheDocument();
    expect(screen.getAllByText("0/0 (0%)")).toHaveLength(5);
  });

  it("keeps vocabulary available when Part Practice fails", async () => {
    const user = userEvent.setup();
    const reloadPartPractice = vi.fn();
    mocks.useDashboardPartPractice.mockReturnValue({
      error: "Cannot connect to server.",
      isLoading: false,
      reload: reloadPartPractice,
      summaries: [],
    });

    render(<HomeDashboard />);

    expect(screen.getByRole("heading", { name: "Vocabulary" })).toBeInTheDocument();
    expect(screen.getByText("Cannot connect to server.")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Retry Part Practice" }),
    );
    expect(reloadPartPractice).toHaveBeenCalledTimes(1);
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
    mocks.useDashboardPartPractice.mockReturnValue({
      error: null,
      isLoading: false,
      reload: vi.fn(),
      summaries: [
        { partNumber: 1, total: 40, answered: 0, correct: 0, wrong: 0 },
      ],
    });

    render(<HomeDashboard />);

    expect(screen.getAllByText("0/0 (0%)")).toHaveLength(7);
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
