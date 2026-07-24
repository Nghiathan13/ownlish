import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV_LINKS,
  APP_NAV_LINKS,
  getAppNavLinksForUser,
} from "@/features/shell/lib/appNavLinks";

describe("getAppNavLinksForUser", () => {
  it("returns only learning nav links", () => {
    expect(getAppNavLinksForUser()).toEqual(APP_NAV_LINKS);
  });

  it("does not include admin in main nav", () => {
    const links = getAppNavLinksForUser();

    expect(links.some((link) => link.href === "/admin")).toBe(false);
    expect(links.some((link) => link.labelKey === "shell.admin")).toBe(false);
    expect(links.some((link) => link.href.startsWith("/admin/"))).toBe(false);
  });

  it("defines admin Tests as a separate admin nav item", () => {
    expect(ADMIN_NAV_LINKS).toEqual([
      expect.objectContaining({
        href: "/admin/toeic",
        labelKey: "nav.tests",
      }),
    ]);
  });

  it("links Tests nav to canonical mock overview URL", () => {
    const testsLink = getAppNavLinksForUser().find(
      (link) => link.labelKey === "nav.tests",
    );

    expect(testsLink?.href).toBe("/tests?tab=mock_tests&year=2026");
  });
});
