import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { PartPracticeCard } from "./PartPracticeCard";

const mocks = vi.hoisted(() => ({
  usePartPracticeOverview: vi.fn(),
}));

vi.mock("../model/usePartPracticeOverview", () => ({
  usePartPracticeOverview: mocks.usePartPracticeOverview,
}));

const overview = {
  summaries: [
    { partNumber: 3, total: 10, answered: 4, correct: 3, wrong: 1 },
  ],
  selectedPartNumber: 3,
  isLoading: false,
  error: null,
  reload: vi.fn(),
  isClearing: false,
  clearingPartNumber: null,
  isStarting: false,
  startingPartNumber: null,
  requestClearHistory: vi.fn(),
  startPartPractice: vi.fn(),
  pendingClearPartNumber: null,
  cancelClearHistory: vi.fn(),
  confirmClearHistory: vi.fn(),
};

describe("PartPracticeCard", () => {
  it("renders the selected part and starts practice", async () => {
    const user = userEvent.setup();
    mocks.usePartPracticeOverview.mockReturnValue(overview);

    render(
      <LocaleProvider>
        <PartPracticeCard selectedPartNumber={3} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Part 3" })).toBeInTheDocument();
    expect(screen.getByText("4/10")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Practice" }));
    expect(overview.startPartPractice).toHaveBeenCalledWith(3, "practice");

    await user.click(screen.getByRole("button", { name: "Review wrong (1)" }));
    expect(overview.startPartPractice).toHaveBeenCalledWith(3, "review_wrong");
  });

  it("retries after a load error", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mocks.usePartPracticeOverview.mockReturnValue({
      ...overview,
      error: "Cannot load part practice.",
      reload,
    });

    render(
      <LocaleProvider>
        <PartPracticeCard selectedPartNumber={3} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
