import { describe, expect, it } from "vitest";
import type { AuthUser } from "@/entities/auth/types";
import {
  ADMIN_NAV_LINK,
  APP_NAV_LINKS,
  getAppNavLinksForUser,
} from "@/features/shell/lib/appNavLinks";

const adminUser: AuthUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN",
};

const regularUser: AuthUser = {
  id: "user-1",
  email: "user@example.com",
  name: null,
  role: "USER",
};

describe("getAppNavLinksForUser", () => {
  it("returns base nav links for guests and regular users", () => {
    expect(getAppNavLinksForUser(null)).toEqual(APP_NAV_LINKS);
    expect(getAppNavLinksForUser(regularUser)).toEqual(APP_NAV_LINKS);
  });

  it("appends admin nav link for admin users", () => {
    expect(getAppNavLinksForUser(adminUser)).toEqual([
      ...APP_NAV_LINKS,
      ADMIN_NAV_LINK,
    ]);
  });
});
