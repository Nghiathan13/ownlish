import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollectionsWorkspaceChrome } from "./CollectionsWorkspaceChrome";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
  useSearchParams: mocks.useSearchParams,
}));

vi.mock("@/features/collections", () => ({
  CollectionCategorySelect: ({
    activeCategory,
  }: {
    activeCategory: string;
  }) => <div data-testid="category-tabs">{activeCategory}</div>,
  OxfordBandTabs: ({ activeBand }: { activeBand: string }) => (
    <div data-testid="band-tabs">{activeBand}</div>
  ),
}));

vi.mock("@/shared/ui/page-header", () => ({
  PageHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-header">{children}</div>
  ),
}));

vi.mock("@/shared/ui/PageShell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("CollectionsWorkspaceChrome", () => {
  beforeEach(() => {
    mocks.usePathname.mockReset();
    mocks.useSearchParams.mockReset();
    mocks.useSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("keeps category tabs on the user workspace and renders the page", () => {
    mocks.usePathname.mockReturnValue("/collections/user");

    render(
      <CollectionsWorkspaceChrome>
        <div>User collections</div>
      </CollectionsWorkspaceChrome>,
    );

    expect(screen.getByTestId("category-tabs")).toHaveTextContent("user");
    expect(screen.queryByTestId("band-tabs")).not.toBeInTheDocument();
    expect(screen.getByText("User collections")).toBeInTheDocument();
  });

  it("keeps category and band tabs on the Oxford overview", () => {
    mocks.usePathname.mockReturnValue("/collections/oxford");
    mocks.useSearchParams.mockReturnValue(new URLSearchParams("band=A2"));

    render(
      <CollectionsWorkspaceChrome>
        <div>Oxford collections</div>
      </CollectionsWorkspaceChrome>,
    );

    expect(screen.getByTestId("category-tabs")).toHaveTextContent("oxford");
    expect(screen.getByTestId("band-tabs")).toHaveTextContent("A2");
    expect(screen.getByText("Oxford collections")).toBeInTheDocument();
  });

  it("hides workspace tabs when an Oxford group is open", () => {
    mocks.usePathname.mockReturnValue("/collections/oxford");
    mocks.useSearchParams.mockReturnValue(
      new URLSearchParams("band=A1&group=3"),
    );

    render(
      <CollectionsWorkspaceChrome>
        <div>Oxford group</div>
      </CollectionsWorkspaceChrome>,
    );

    expect(screen.queryByTestId("page-header")).not.toBeInTheDocument();
    expect(screen.getByText("Oxford group")).toBeInTheDocument();
  });

  it("leaves collection detail routes without workspace chrome", () => {
    mocks.usePathname.mockReturnValue("/collections/collection-id");

    render(
      <CollectionsWorkspaceChrome>
        <div>Collection detail</div>
      </CollectionsWorkspaceChrome>,
    );

    expect(screen.queryByTestId("page-header")).not.toBeInTheDocument();
    expect(screen.getByText("Collection detail")).toBeInTheDocument();
  });
});
