import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import type { CatalogTestSummary } from "../model/catalogTestSummary";
import { MockTestsCards } from "./MockTestsCards";

const mocks = vi.hoisted(() => ({
  useTestsOverview: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../model/useTestsOverview", () => ({
  useTestsOverview: mocks.useTestsOverview,
}));

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
  parts: [{ partNumber: 1, partCorrectCount: 0, partWrongCount: 0 }],
};

const overview = {
  selectedTest: null,
  isLoadingTests: false,
  testsError: null,
  reloadTests: vi.fn(),
  tests: [test],
  clearingTestKey: null,
  requestClearHistory: vi.fn(),
  openPartPicker: vi.fn(),
  startTest: vi.fn(),
  partPickerIntent: "practice" as const,
  startingTestKey: null,
  closePartPicker: vi.fn(),
  startMock: vi.fn(),
  pendingClearTestKey: null,
  isClearingHistory: false,
  cancelClearHistory: vi.fn(),
  confirmClearHistory: vi.fn(),
  pendingMockRun: null,
  cancelMockDecision: vi.fn(),
  continueMock: vi.fn(),
  restartMock: vi.fn(),
};

describe("MockTestsCards", () => {
  it("renders catalog cards for the selected year", () => {
    mocks.useTestsOverview.mockReturnValue(overview);

    render(
      <LocaleProvider>
        <MockTestsCards selectedYear={2023} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Test 1" })).toBeInTheDocument();
    expect(mocks.useTestsOverview).toHaveBeenCalledWith(2023);
  });

  it("retries after a catalog error", async () => {
    const user = userEvent.setup();
    const reloadTests = vi.fn();
    mocks.useTestsOverview.mockReturnValue({
      ...overview,
      tests: [],
      testsError: "Cannot load TOEIC catalog.",
      reloadTests,
    });

    render(
      <LocaleProvider>
        <MockTestsCards selectedYear={2023} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Cannot load TOEIC catalog.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(reloadTests).toHaveBeenCalledTimes(1);
  });

  it("shows an empty year state", () => {
    mocks.useTestsOverview.mockReturnValue({
      ...overview,
      tests: [],
    });

    render(
      <LocaleProvider>
        <MockTestsCards selectedYear={2023} />
      </LocaleProvider>,
    );

    expect(
      screen.getByText("No tests available for this year yet."),
    ).toBeInTheDocument();
  });
});
