import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardActivityPage } from "./DashboardActivityPage";

const mocks = vi.hoisted(() => ({
  useAuthSession: vi.fn(),
  useCollectionsListQuery: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/entities/collection", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/collection")>()),
  useCollectionsListQuery: mocks.useCollectionsListQuery,
}));

vi.mock("@/features/dashboard-activity", () => ({
  DashboardActivityPanel: () => <div>Activity panel</div>,
}));

vi.mock("@/shared/lib/providers", async () => {
  const { translate } = await import("@/shared/i18n");

  return {
    useLocale: () => ({
      locale: "en" as const,
      t: (key: Parameters<typeof translate>[1]) => translate("en", key),
    }),
    useT: () => (key: Parameters<typeof translate>[1]) => translate("en", key),
  };
});

const defaultCollection = {
  id: "collection-1",
  name: "Daily vocabulary",
  description: null,
  kind: "USER",
  source: null,
  cefrLevel: null,
  isDefault: true,
  isPublic: false,
  itemCount: 20,
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

describe("DashboardActivityPage", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/dashboard/my-activity");
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.useCollectionsListQuery.mockReturnValue({
      collections: [defaultCollection],
      collectionsError: null,
      isLoadingCollections: false,
      reloadCollections: vi.fn(),
    });
  });

  it("marks My activity active and composes the activity panel", () => {
    render(<DashboardActivityPage />);

    expect(screen.getByRole("tab", { name: "My activity" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Progress" })).toHaveAttribute(
      "href",
      "/dashboard/progress?mode=review",
    );
    expect(screen.getByText("Activity panel")).toBeInTheDocument();
    expect(screen.queryByText("Progress panel")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Review" })).not.toBeInTheDocument();
  });

  it("shows the activity skeleton while collections load", () => {
    mocks.useCollectionsListQuery.mockReturnValue({
      collections: [],
      collectionsError: null,
      isLoadingCollections: true,
      reloadCollections: vi.fn(),
    });

    const { container } = render(<DashboardActivityPage />);

    expect(screen.getByRole("tab", { name: "My activity" })).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
    expect(screen.queryByText("Activity panel")).not.toBeInTheDocument();
  });

  it("surfaces collection loading failures with retry", async () => {
    const user = userEvent.setup();
    const reloadCollections = vi.fn();
    mocks.useCollectionsListQuery.mockReturnValue({
      collections: [],
      collectionsError: "Cannot connect to server.",
      isLoadingCollections: false,
      reloadCollections,
    });

    render(<DashboardActivityPage />);

    expect(
      screen.getByText("We couldn't load your collections."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reloadCollections).toHaveBeenCalledTimes(1);
  });

  it("prompts setup when the user has no default collection", () => {
    mocks.useCollectionsListQuery.mockReturnValue({
      collections: [],
      collectionsError: null,
      isLoadingCollections: false,
      reloadCollections: vi.fn(),
    });

    render(<DashboardActivityPage />);

    expect(screen.getByText("Set up your vocabulary space")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse collections" })).toHaveAttribute(
      "href",
      expect.stringContaining("/collections"),
    );
    expect(screen.queryByText("Activity panel")).not.toBeInTheDocument();
  });
});
