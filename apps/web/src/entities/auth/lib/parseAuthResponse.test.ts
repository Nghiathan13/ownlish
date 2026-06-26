import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/http";
import {
  parseAuthResponse,
  parseAuthUser,
} from "@/entities/auth/lib/parseAuthResponse";

describe("parseAuthResponse", () => {
  it("parses a valid auth user with role", () => {
    expect(
      parseAuthUser({
        id: "user-1",
        email: "user@example.com",
        name: "User",
        role: "USER",
      }),
    ).toEqual({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      role: "USER",
    });
  });

  it("parses admin role", () => {
    expect(
      parseAuthUser({
        id: "admin-1",
        email: "admin@example.com",
        name: null,
        role: "ADMIN",
      }),
    ).toEqual({
      id: "admin-1",
      email: "admin@example.com",
      name: null,
      role: "ADMIN",
    });
  });

  it("rejects invalid role", () => {
    expect(() =>
      parseAuthUser({
        id: "user-1",
        email: "user@example.com",
        name: null,
        role: "SUPERADMIN",
      }),
    ).toThrow(ApiError);
  });

  it("parses auth response with user role", () => {
    expect(
      parseAuthResponse({
        accessToken: "token",
        user: {
          id: "user-1",
          email: "user@example.com",
          name: null,
          role: "USER",
        },
      }),
    ).toEqual({
      accessToken: "token",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: null,
        role: "USER",
      },
    });
  });
});
