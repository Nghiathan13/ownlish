import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/tests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/tests")>()),
  MockTestsPage: ({ year }: { year?: number }) => <div data-year={year} />,
}));

import MockTestsRoute from "./page";

describe("MockTestsRoute", () => {
  it("renders the mock tests page for a valid year", async () => {
    const page = await MockTestsRoute({
      searchParams: Promise.resolve({ year: "2023" }),
    });

    expect(page.props).toMatchObject({ year: 2023 });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects a missing or invalid year to the default mock tests URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      MockTestsRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/tests/mock-tests?year=2026");

    await expect(
      MockTestsRoute({
        searchParams: Promise.resolve({ year: "1999" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/tests/mock-tests?year=2026");
  });
});
