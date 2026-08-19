import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import OxfordReviewPartLegacyRoute from "./page";

describe("OxfordReviewPartLegacyRoute", () => {
  it("redirects a legacy review part path to the query URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      OxfordReviewPartLegacyRoute({
        params: Promise.resolve({ band: "A2", part: "part-1" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/review/oxford?band=A2&group=1");
  });
});
