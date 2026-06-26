import { describe, expect, it } from "vitest";
import { APP_NAV_LINKS, getAppNavLinksForUser } from "@/features/shell/lib/appNavLinks";

describe("getAppNavLinksForUser", () => {
  it("returns only learning nav links", () => {
    expect(getAppNavLinksForUser()).toEqual(APP_NAV_LINKS);
  });

  it("does not include admin in main nav", () => {
    const links = getAppNavLinksForUser();

    expect(links.some((link) => link.href === "/admin")).toBe(false);
    expect(links.some((link) => link.label === "Admin")).toBe(false);
  });
});
