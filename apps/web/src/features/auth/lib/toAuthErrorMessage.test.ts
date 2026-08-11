import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/http";
import { toAuthErrorMessage } from "./toAuthErrorMessage";

describe("toAuthErrorMessage", () => {
  it("uses the API error message when available", () => {
    expect(toAuthErrorMessage(new ApiError("Invalid code.", 400), "Fallback")).toBe(
      "Invalid code.",
    );
  });

  it("falls back for unknown errors", () => {
    expect(toAuthErrorMessage(new Error("network"), "Cannot connect")).toBe(
      "Cannot connect",
    );
  });
});
