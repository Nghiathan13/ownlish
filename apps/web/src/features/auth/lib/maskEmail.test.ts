import { describe, expect, it } from "vitest";
import { maskEmail } from "./maskEmail";

describe("maskEmail", () => {
  it("masks the local part after the first two characters", () => {
    expect(maskEmail("linh@example.com")).toBe("li••@example.com");
    expect(maskEmail("ab@example.com")).toBe("ab•@example.com");
    expect(maskEmail("a@example.com")).toBe("a•@example.com");
  });

  it("returns the original value when the email is malformed", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
    expect(maskEmail("@missing-local.com")).toBe("@missing-local.com");
  });
});
