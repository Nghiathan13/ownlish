import { describe, expect, it } from "vitest";
import { isAdminUser } from "@/features/auth/lib/isAdminUser";

describe("isAdminUser", () => {
  it("returns false for null user", () => {
    expect(isAdminUser(null)).toBe(false);
  });

  it("returns false for regular users", () => {
    expect(
      isAdminUser({
        id: "user-1",
        email: "user@example.com",
        name: null,
        avatarUrl: null,
        role: "USER",
      }),
    ).toBe(false);
  });

  it("returns true for admin users", () => {
    expect(
      isAdminUser({
        id: "admin-1",
        email: "admin@example.com",
        name: "Admin",
        avatarUrl: null,
        role: "ADMIN",
      }),
    ).toBe(true);
  });
});
