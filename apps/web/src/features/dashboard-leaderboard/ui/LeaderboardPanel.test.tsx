import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LeaderboardPanel } from "./LeaderboardPanel";

const useStudyTimeLeaderboard = vi.hoisted(() => vi.fn());
const useExperienceLeaderboard = vi.hoisted(() => vi.fn());

vi.mock("../model/useStudyTimeLeaderboard", () => ({
  useStudyTimeLeaderboard,
}));
vi.mock("../model/useExperienceLeaderboard", () => ({
  useExperienceLeaderboard,
}));

function renderPanel(
  location: React.ComponentProps<typeof LeaderboardPanel>["location"],
) {
  return render(
    <LocaleProvider>
      <LeaderboardPanel
        isAuthenticated
        location={location}
        userId="user-1"
      />
    </LocaleProvider>,
  );
}

describe("LeaderboardPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
    useStudyTimeLeaderboard.mockReturnValue({
      error: null,
      isLoading: false,
      leaderboard: {
        period: "all",
        startsOn: null,
        endsOn: null,
        entries: [
          {
            rank: 1,
            displayName: "Linh",
            avatarUrl: null,
            studySeconds: 7_500,
          },
          {
            rank: 2,
            displayName: "Minh",
            avatarUrl: "https://assets.example/minh.png",
            studySeconds: 60,
          },
        ],
      },
      reload: vi.fn(),
    });
    useExperienceLeaderboard.mockReturnValue({
      error: null,
      isLoading: false,
      leaderboard: { entries: [] },
      reload: vi.fn(),
    });
  });

  afterEach(() => vi.useRealTimers());

  it("renders public leaderboard rows and the Experience metric tab", () => {
    renderPanel({ metric: "study-time", period: "all", anchor: null });

    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("Linh")).toBeInTheDocument();
    expect(screen.getByText("2 h 5 min")).toBeInTheDocument();
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://assets.example/minh.png",
    );
    expect(screen.getByRole("tab", { name: "Experience" })).toHaveAttribute(
      "href",
      "/dashboard/leaderboard?metric=experience",
    );
  });

  it("loads the Experience leaderboard without enabling study-time data", () => {
    useExperienceLeaderboard.mockReturnValue({
      error: null,
      isLoading: false,
      leaderboard: {
        entries: [
          { rank: 1, displayName: "Linh", avatarUrl: null, experience: 880 },
        ],
      },
      reload: vi.fn(),
    });
    renderPanel({ metric: "experience", period: "all", anchor: null });

    expect(screen.getByText("880 XP")).toBeInTheDocument();
    expect(useStudyTimeLeaderboard).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(useExperienceLeaderboard).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    expect(screen.queryByRole("button", { name: "Next period" })).not.toBeInTheDocument();
  });

  it("disables future navigation for the current anchored period", () => {
    renderPanel({ metric: "study-time", period: "week", anchor: "2026-08-10" });

    expect(screen.getByRole("button", { name: "Next period" })).toBeDisabled();
  });

  it("retries a study-time request from the panel error state", () => {
    const reload = vi.fn();
    useStudyTimeLeaderboard.mockReturnValue({
      error: "Network error",
      isLoading: false,
      leaderboard: null,
      reload,
    });

    renderPanel({ metric: "study-time", period: "all", anchor: null });
    screen.getByRole("button", { name: "Try again" }).click();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
