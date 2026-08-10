import { describe, expect, it } from "vitest";
import { formatCreatedLabel, formatDisplayDate } from "./date";

describe("date formatters", () => {
  it("returns null when no date is available", () => {
    expect(formatDisplayDate(null)).toBeNull();
    expect(formatCreatedLabel(undefined)).toBeNull();
  });

  it("formats a display date with the requested locale", () => {
    expect(formatDisplayDate("2026-08-10T00:00:00.000Z", "en-US")).toBe(
      "Aug 10, 2026",
    );
    expect(formatCreatedLabel("2026-08-10T00:00:00.000Z", "vi-VN")).toBe(
      "10 thg 8, 2026",
    );
  });
});
