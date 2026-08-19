import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));
vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => <div data-testid="auth">{children}</div>,
}));
vi.mock("@/_pages/collections", () => ({
  CollectionsWorkspacePage: () => <div>Collections workspace</div>,
}));
vi.mock("@/_pages/review", () => ({
  ReviewWorkspacePage: () => <div>Review workspace</div>,
}));
vi.mock("@/features/review", () => ({
  ReviewModeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import CollectionsLayout from "./collections/layout";
import ReviewLayout from "./review/layout";
import OxfordReviewLayout from "./review/oxford/layout";

describe("authenticated route layouts", () => {
  it("renders the persistent collections workspace for user and Oxford workspaces", () => {
    usePathname.mockReturnValue("/collections/user");
    const { rerender } = render(<CollectionsLayout><div>Child page</div></CollectionsLayout>);
    expect(screen.getByTestId("auth")).toBeInTheDocument();
    expect(screen.getByText("Collections workspace")).toBeInTheDocument();
    expect(screen.queryByText("Child page")).not.toBeInTheDocument();

    usePathname.mockReturnValue("/collections/oxford/A1");
    rerender(<CollectionsLayout><div>Child page</div></CollectionsLayout>);
    expect(screen.getByText("Collections workspace")).toBeInTheDocument();
  });

  it("renders the nested page outside the collections workspace", () => {
    usePathname.mockReturnValue("/collections/collection-id");
    render(<CollectionsLayout><div>Collection detail</div></CollectionsLayout>);
    expect(screen.getByText("Collection detail")).toBeInTheDocument();
  });

  it("wraps review routes and leaves the Oxford child layout transparent", () => {
    const { rerender } = render(<ReviewLayout><div>Review child</div></ReviewLayout>);
    expect(screen.getByText("Review workspace")).toBeInTheDocument();
    expect(screen.getByText("Review child")).toBeInTheDocument();

    rerender(<OxfordReviewLayout><div>Oxford review child</div></OxfordReviewLayout>);
    expect(screen.getByText("Oxford review child")).toBeInTheDocument();
  });
});
