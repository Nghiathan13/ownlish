import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/review", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/review")>()),
  OxfordReviewPage: ({ band, group }: { band: string; group: string }) => (
    <div data-band={band} data-group={group} />
  ),
}));

import OxfordReviewRoute from "./page";

describe("OxfordReviewRoute", () => {
  it("renders the Oxford review page for a valid band and group", async () => {
    const page = await OxfordReviewRoute({
      searchParams: Promise.resolve({ band: "A2", group: "1" }),
    });

    expect(page.props).toMatchObject({ band: "A2", group: "1" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects a missing mode to the default Oxford review URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      OxfordReviewRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/review/oxford?band=A1&group=1");
  });
});
