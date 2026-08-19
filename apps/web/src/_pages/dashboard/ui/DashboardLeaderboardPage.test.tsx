import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardLeaderboardPage } from "./DashboardLeaderboardPage";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
  useAuthSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));

vi.mock("@/features/auth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/session")>()),
  isAuthenticatedStatus: (status: string) => status === "authenticated",
  useAuthSession: mocks.useAuthSession,
}));

vi.mock("@/features/dashboard-leaderboard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/dashboard-leaderboard")>()),
  LeaderboardPanel: ({ location }: { location: { metric: string } }) => (
    <div>Leaderboard {location.metric}</div>
  ),
}));

vi.mock("@/shared/lib/providers", async () => {
  const { translate } = await import("@/shared/i18n");

  return {
    useLocale: () => ({ locale: "en" as const, t: (key: Parameters<typeof translate>[1]) => translate("en", key) }),
    useT: () => (key: Parameters<typeof translate>[1]) => translate("en", key),
  };
});

describe("DashboardLeaderboardPage", () => {
  beforeEach(() => {
    mocks.usePathname.mockReturnValue("/dashboard/leaderboard");
    mocks.useAuthSession.mockReturnValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
  });

  it("renders independently from collection loading and preserves Experience route state", () => {
    render(
      <DashboardLeaderboardPage
        anchorParam={null}
        metricParam="experience"
        periodParam={null}
      />,
    );

    expect(screen.getByText("Leaderboard experience")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Leaderboard" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "My activity" })).toHaveAttribute(
      "href",
      "/dashboard/my-activity",
    );
    expect(screen.queryByText("We couldn't load your collections.")).not.toBeInTheDocument();
    expect(screen.queryByText("Set up your vocabulary space")).not.toBeInTheDocument();
  });
});
