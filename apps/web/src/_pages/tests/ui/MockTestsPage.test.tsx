import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { MockTestsPage } from "./MockTestsPage";

const mocks = vi.hoisted(() => ({
  mockTestsCards: vi.fn(() => <div data-testid="mock-tests-cards" />),
  mockTestsTab: vi.fn(() => <div data-testid="mock-tests-tab" />),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/tests/mock-tests",
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/test-overview", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/test-overview")>()),
  MockTestsCards: mocks.mockTestsCards,
  MockTestsTab: mocks.mockTestsTab,
}));

describe("MockTestsPage", () => {
  beforeEach(() => {
    mocks.mockTestsCards.mockClear();
    mocks.mockTestsTab.mockClear();
  });

  it("renders year tabs and cards inside the shared card frame", () => {
    render(
      <LocaleProvider>
        <MockTestsPage year={2023} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Mock Tests" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("mock-tests-tab")).toBeInTheDocument();
    expect(screen.getByTestId("mock-tests-cards").parentElement).toHaveClass(
      "grid",
      "gap-4",
    );
    expect(mocks.mockTestsTab).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedYear: 2023,
      }),
      undefined,
    );
    expect(mocks.mockTestsCards).toHaveBeenLastCalledWith(
      expect.objectContaining({
        selectedYear: 2023,
      }),
      undefined,
    );
  });
});
