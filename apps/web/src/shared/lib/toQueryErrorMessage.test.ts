import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/http";
import { toQueryErrorMessage } from "./toQueryErrorMessage";

describe("toQueryErrorMessage", () => {
  it("uses the API message when the error is an ApiError", () => {
    expect(
      toQueryErrorMessage(new ApiError("Invalid request", 400), "Fallback"),
    ).toBe("Invalid request");
  });

  it("uses fallback for unknown errors and null for no error", () => {
    expect(toQueryErrorMessage(new Error("Unexpected"), "Fallback")).toBe(
      "Fallback",
    );
    expect(toQueryErrorMessage(null, "Fallback")).toBeNull();
  });
});
