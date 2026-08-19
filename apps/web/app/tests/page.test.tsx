import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import TestsIndexRoute from "./page";

describe("TestsIndexRoute", () => {
  it("redirects the index to the default mock tests URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      TestsIndexRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/tests/mock-tests?year=2026");
  });

  it("redirects a legacy part-practice query to the static part route", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      TestsIndexRoute({
        searchParams: Promise.resolve({ tab: "part_practice", part: "3" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/tests/part-practice?part=3");
  });
});
