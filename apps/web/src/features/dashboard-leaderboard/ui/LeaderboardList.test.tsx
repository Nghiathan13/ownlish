import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { LeaderboardList } from "./LeaderboardList";

function renderList(props: Partial<React.ComponentProps<typeof LeaderboardList>>) {
  const onRetry = vi.fn();

  render(
    <LocaleProvider>
      <LeaderboardList
        entries={[]}
        error={null}
        isLoading={false}
        onRetry={onRetry}
        valueLabel="Study time"
        {...props}
      />
    </LocaleProvider>,
  );

  return onRetry;
}

describe("LeaderboardList", () => {
  it("renders loading and empty states", () => {
    const { rerender } = render(
      <LocaleProvider>
        <LeaderboardList entries={[]} error={null} isLoading onRetry={vi.fn()} valueLabel="Study time" />
      </LocaleProvider>,
    );

    expect(screen.getByRole("status", { name: "Loading leaderboard" })).toBeInTheDocument();

    rerender(
      <LocaleProvider>
        <LeaderboardList entries={[]} error={null} isLoading={false} onRetry={vi.fn()} valueLabel="Study time" />
      </LocaleProvider>,
    );
    expect(
      screen.getByText("No results have been recorded for this leaderboard yet."),
    ).toBeInTheDocument();
  });

  it("renders errors with retry", () => {
    const onRetry = renderList({ error: "Network error" });

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
