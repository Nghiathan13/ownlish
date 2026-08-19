import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/shared/lib/providers";
import { TestsScreen } from "./TestsScreen";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tests/mock-tests",
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("TestsScreen", () => {
  it("renders title tabs around the page content", () => {
    render(
      <LocaleProvider>
        <TestsScreen>
          <p>Screen body</p>
        </TestsScreen>
      </LocaleProvider>,
    );

    expect(screen.getByRole("tab", { name: "Mock Tests" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Screen body")).toBeInTheDocument();
  });
});
