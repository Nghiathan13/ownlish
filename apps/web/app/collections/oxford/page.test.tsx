import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/_pages/collections", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/_pages/collections")>()),
  OxfordCollectionsPage: ({
    band,
    group,
  }: {
    band: string | null;
    group: string | null;
  }) => <div data-band={band} data-group={group} />,
}));

import OxfordCollectionsRoute from "./page";

describe("OxfordCollectionsRoute", () => {
  it("renders the Oxford collections page for a valid band and group", async () => {
    const page = await OxfordCollectionsRoute({
      searchParams: Promise.resolve({ band: "A2", group: "3" }),
    });

    expect(page.props).toMatchObject({ band: "A2", group: "3" });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects a missing or invalid band to the default Oxford URL", async () => {
    redirect.mockImplementation(() => {
      throw new Error("redirect");
    });

    await expect(
      OxfordCollectionsRoute({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect");
    expect(redirect).toHaveBeenCalledWith("/collections/oxford?band=A1");
  });
});
