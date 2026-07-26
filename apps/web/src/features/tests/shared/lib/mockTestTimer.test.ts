import { describe, expect, it } from "vitest";
import {
  formatMockCountdown,
  getMockTimeLimitMinutes,
} from "@/features/tests/shared/lib/mockTestTimer";

describe("mock test timer", () => {
  it("sums the default duration of selected parts in minutes", () => {
    expect(getMockTimeLimitMinutes([1])).toBe(5);
    expect(getMockTimeLimitMinutes([1, 2])).toBe(15);
    expect(getMockTimeLimitMinutes([1, 2, 3, 4, 5, 6, 7])).toBe(120);
  });

  it("formats countdown as hours, minutes, and seconds", () => {
    expect(formatMockCountdown(0)).toBe("00:00:00");
    expect(formatMockCountdown(600)).toBe("00:10:00");
    expect(formatMockCountdown(3661)).toBe("01:01:01");
  });
});
