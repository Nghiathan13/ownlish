import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { ReviewProgressCard } from "./ReviewProgressCard";

const mocks = vi.hoisted(() => ({
  useReviewProgress: vi.fn(),
  toggleBand: vi.fn(),
  toggleCollection: vi.fn(),
}));

vi.mock("../model/useReviewProgress", () => ({
  useReviewProgress: mocks.useReviewProgress,
}));

vi.mock("./ReviewProgressDonut", () => ({
  ReviewProgressDonut: ({
    progress,
  }: {
    progress: { total: number } | null;
  }) => <div data-testid="donut">Donut {progress?.total ?? 0}</div>,
}));

vi.mock("./ReviewProgressLevels", () => ({
  ReviewProgressLevels: ({
    progress,
  }: {
    progress: { total: number } | null;
  }) => <div data-testid="levels">Levels {progress?.total ?? 0}</div>,
}));

const progress = {
  total: 15,
  masteredCount: 5,
  learningCount: 5,
  newCount: 5,
  levelCounts: Array.from({ length: 7 }, (_, index) => ({
    level: index + 1,
    count: 0,
  })),
};

function renderCard(
  props: Partial<React.ComponentProps<typeof ReviewProgressCard>> = {},
) {
  return render(
    <LocaleProvider>
      <ReviewProgressCard
        collections={[]}
        isAuthenticated
        source="collection"
        userId="user-1"
        {...props}
      />
    </LocaleProvider>,
  );
}

describe("ReviewProgressCard", () => {
  beforeEach(() => {
    mocks.toggleBand.mockReset();
    mocks.toggleCollection.mockReset();
    mocks.useReviewProgress.mockReturnValue({
      activeBandIds: ["A1", "A2"],
      activeCollectionIds: ["c1"],
      bandOptions: [
        { id: "A1", label: "A1" },
        { id: "A2", label: "A2" },
      ],
      collectionOptions: [
        { id: "c1", label: "Daily vocabulary" },
        { id: "c2", label: "Travel" },
      ],
      error: null,
      isLoading: false,
      progress,
      toggleBand: mocks.toggleBand,
      toggleCollection: mocks.toggleCollection,
    });
  });

  it("renders the donut summary by default", () => {
    renderCard();

    expect(screen.getByText("Collection progress")).toBeInTheDocument();
    expect(screen.getByTestId("donut")).toHaveTextContent("Donut 15");
    expect(screen.queryByTestId("levels")).not.toBeInTheDocument();
  });

  it("toggles between summary and levels views", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(
      screen.getByRole("button", { name: "Switch to levels chart" }),
    );
    expect(screen.getByTestId("levels")).toHaveTextContent("Levels 15");
    expect(screen.queryByTestId("donut")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Switch to summary chart" }),
    );
    expect(screen.getByTestId("donut")).toBeInTheDocument();
  });

  it("filters collections and closes on outside click", async () => {
    const user = userEvent.setup();
    renderCard({ source: "collection" });

    await user.click(screen.getByRole("button", { name: "Filter collections" }));
    const option = screen.getByRole("menuitemcheckbox", {
      name: "Daily vocabulary",
    });
    expect(option).toHaveAttribute("aria-checked", "true");

    await user.click(option);
    expect(mocks.toggleCollection).toHaveBeenCalledWith("c1");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("filters oxford bands when source is oxford", async () => {
    const user = userEvent.setup();
    renderCard({ source: "oxford" });

    await user.click(screen.getByRole("button", { name: "Filter bands" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "A2" }));
    expect(mocks.toggleBand).toHaveBeenCalledWith("A2");
  });

  it("shows loading and error states", () => {
    mocks.useReviewProgress.mockReturnValue({
      ...mocks.useReviewProgress(),
      isLoading: true,
      progress: null,
    });
    const { rerender } = renderCard();
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

    mocks.useReviewProgress.mockReturnValue({
      activeBandIds: [],
      activeCollectionIds: [],
      bandOptions: [],
      collectionOptions: [],
      error: "Cannot load dashboard.",
      isLoading: false,
      progress: null,
      toggleBand: mocks.toggleBand,
      toggleCollection: mocks.toggleCollection,
    });

    rerender(
      <LocaleProvider>
        <ReviewProgressCard
          collections={[]}
          isAuthenticated
          source="collection"
          userId="user-1"
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Cannot load dashboard.")).toBeInTheDocument();
    expect(screen.queryByTestId("donut")).not.toBeInTheDocument();
  });

  it("shows an empty filter menu when there are no options", async () => {
    const user = userEvent.setup();
    mocks.useReviewProgress.mockReturnValue({
      activeBandIds: [],
      activeCollectionIds: [],
      bandOptions: [],
      collectionOptions: [],
      error: null,
      isLoading: false,
      progress,
      toggleBand: mocks.toggleBand,
      toggleCollection: mocks.toggleCollection,
    });

    renderCard();
    await user.click(screen.getByRole("button", { name: "Filter collections" }));
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
