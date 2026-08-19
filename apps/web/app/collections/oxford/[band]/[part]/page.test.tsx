import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import OxfordPartLegacyRoute from "./page";

describe("OxfordPartLegacyRoute", () => {
  it("redirects a legacy part path to the query URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      OxfordPartLegacyRoute({
        params: Promise.resolve({ band: "A2", part: "part-3" }),
      }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith(
      "/collections/oxford?band=A2&group=3",
    );
  });
});
