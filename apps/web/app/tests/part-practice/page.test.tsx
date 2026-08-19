import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/tests", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/tests")>()),
  PartPracticePage: ({ partNumber }: { partNumber?: number }) => (
    <div data-part={partNumber} />
  ),
}));

import PartPracticeRoute from "./page";

describe("PartPracticeRoute", () => {
  it("renders the part practice page for a valid part", async () => {
    const page = await PartPracticeRoute({
      searchParams: Promise.resolve({ part: "3" }),
    });

    expect(page.props).toMatchObject({ partNumber: 3 });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects a missing or invalid part to the default part practice URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      PartPracticeRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/tests/part-practice?part=1");

    await expect(
      PartPracticeRoute({
        searchParams: Promise.resolve({ part: "9" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/tests/part-practice?part=1");
  });
});
