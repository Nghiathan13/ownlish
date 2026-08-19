import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth">{children}</div>
  ),
}));
vi.mock("@/_pages/review", () => ({
  ReviewCategoryTabs: () => <div data-testid="review-tabs" />,
}));
vi.mock("@/features/review", () => ({
  ReviewModeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import ReviewLayout from "./layout";

describe("ReviewLayout", () => {
  it("wraps review routes with auth, provider, persistent tabs, and the page", () => {
    render(
      <ReviewLayout>
        <div>Review child</div>
      </ReviewLayout>,
    );

    expect(screen.getByTestId("auth")).toBeInTheDocument();
    expect(screen.getByTestId("review-tabs")).toBeInTheDocument();
    expect(screen.getByText("Review child")).toBeInTheDocument();
  });
});
