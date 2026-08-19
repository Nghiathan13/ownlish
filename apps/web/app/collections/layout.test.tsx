import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth">{children}</div>
  ),
}));
vi.mock("@/_pages/collections", () => ({
  CollectionsWorkspaceChrome: ({ children }: { children: ReactNode }) => (
    <div data-testid="collections-chrome">{children}</div>
  ),
}));

import CollectionsLayout from "./layout";

describe("CollectionsLayout", () => {
  it("wraps collections routes with auth, persistent chrome, and the page", () => {
    render(
      <CollectionsLayout>
        <div>Child page</div>
      </CollectionsLayout>,
    );

    expect(screen.getByTestId("auth")).toBeInTheDocument();
    expect(screen.getByTestId("collections-chrome")).toBeInTheDocument();
    expect(screen.getByText("Child page")).toBeInTheDocument();
  });
});
