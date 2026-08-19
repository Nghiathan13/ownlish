import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { CatalogTestSummary } from "../model/catalogTestSummary";
import { TestCard } from "./TestCard";

const test: CatalogTestSummary = {
  catalog: {
    id: "ets-2023-1",
    series: "ETS",
    year: 2023,
    testNumber: 1,
    complete: true,
    parts: [],
  },
  totalQuestions: 10,
  parts: [
    { partNumber: 1, partCorrectCount: 2, partWrongCount: 1 },
    { partNumber: 2, partCorrectCount: 0, partWrongCount: 0 },
  ],
};

function renderCard(overrides: Partial<Parameters<typeof TestCard>[0]> = {}) {
  const props = {
    test,
    onClearHistory: vi.fn(),
    onMock: vi.fn(),
    onMockHistory: vi.fn(),
    onPractice: vi.fn(),
    onReviewWrong: vi.fn(),
    ...overrides,
  };

  render(
    <LocaleProvider>
      <TestCard {...props} />
    </LocaleProvider>,
  );

  return props;
}

describe("TestCard", () => {
  it("shows progress and starts mock or practice", async () => {
    const user = userEvent.setup();
    const props = renderCard();

    expect(screen.getByRole("heading", { name: "Test 1" })).toBeInTheDocument();
    expect(screen.getByText("3/10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mock" }));
    await user.click(screen.getByRole("button", { name: "Practice" }));
    await user.click(screen.getByRole("button", { name: "Mock history" }));
    await user.click(screen.getByRole("button", { name: "Review wrong (1)" }));
    await user.click(screen.getByRole("button", { name: "Clear history" }));

    expect(props.onMock).toHaveBeenCalledTimes(1);
    expect(props.onPractice).toHaveBeenCalledTimes(1);
    expect(props.onMockHistory).toHaveBeenCalledTimes(1);
    expect(props.onReviewWrong).toHaveBeenCalledTimes(1);
    expect(props.onClearHistory).toHaveBeenCalledTimes(1);
  });

  it("hides review wrong when there is no progress", () => {
    renderCard({
      test: {
        ...test,
        parts: [{ partNumber: 1, partCorrectCount: 0, partWrongCount: 0 }],
      },
    });

    expect(screen.getByText("No practice progress yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review wrong (all parts)" }),
    ).toBeDisabled();
  });
});
