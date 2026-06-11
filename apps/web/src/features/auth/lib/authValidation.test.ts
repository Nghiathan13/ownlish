import { describe, expect, it } from "vitest";
import { getAuthValidationError, type AuthMode } from "./authValidation";

function validate(overrides: Partial<{
  email: string;
  mode: AuthMode;
  name: string;
  password: string;
}> = {}) {
  return getAuthValidationError({
    email: "test@example.com",
    mode: "login",
    name: "",
    password: "test123456",
    ...overrides,
  });
}

describe("getAuthValidationError", () => {
  it("requires email", () => {
    expect(validate({ email: "   " })).toBe("Email is required.");
  });

  it("validates email format", () => {
    expect(validate({ email: "bad-email" })).toBe(
      "Enter a valid email address.",
    );
  });

  it("requires password", () => {
    expect(validate({ password: "" })).toBe("Password is required.");
  });

  it("limits password length", () => {
    expect(validate({ password: "a".repeat(129) })).toBe(
      "Password must be at most 128 characters.",
    );
  });

  it("does not require minimum password length when logging in", () => {
    expect(validate({ mode: "login", password: "short" })).toBeNull();
  });

  it("requires minimum password length when registering", () => {
    expect(validate({ mode: "register", password: "short" })).toBe(
      "Password must be at least 8 characters.",
    );
  });

  it("limits register name length after trimming", () => {
    expect(
      validate({
        mode: "register",
        name: ` ${"a".repeat(81)} `,
      }),
    ).toBe("Name must be at most 80 characters.");
  });

  it("accepts valid login and register inputs", () => {
    expect(validate()).toBeNull();
    expect(validate({ mode: "register", name: "Test User" })).toBeNull();
  });
});
