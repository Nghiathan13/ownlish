import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/dashboard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/_pages/dashboard")>();

  return {
    ...actual,
    DashboardProgressPage: ({ mode }: { mode: string }) => (
      <div data-mode={mode} />
    ),
  };
});

import DashboardProgressRoute from "./page";

describe("DashboardProgressRoute", () => {
  it("passes a valid mode to the progress page", async () => {
    const page = await DashboardProgressRoute({
      searchParams: Promise.resolve({ mode: "practice" }),
    });

    expect(page.props).toMatchObject({ mode: "practice" });
  });

  it("redirects a missing or invalid mode to the default progress URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      DashboardProgressRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/dashboard/progress?mode=review");

    await expect(
      DashboardProgressRoute({
        searchParams: Promise.resolve({ mode: "unknown" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/dashboard/progress?mode=review");
  });
});
