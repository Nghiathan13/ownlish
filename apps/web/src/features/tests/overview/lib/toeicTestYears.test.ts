import { describe, expect, it } from "vitest";
import {
  getToeicTestYears,
  resolveToeicSelectedYear,
} from "@/features/tests/overview/lib/toeicTestYears";

describe("getToeicTestYears", () => {
  it("keeps only known TOEIC years in catalog order", () => {
    expect(getToeicTestYears([2026, 2025, 1999, 2024])).toEqual([
      2026,
      2025,
      2024,
    ]);
  });

  it("returns an empty list when no years match", () => {
    expect(getToeicTestYears([1999])).toEqual([]);
  });
});

describe("resolveToeicSelectedYear", () => {
  const availableYears = [2026, 2025] as const;

  it("keeps a valid selected year", () => {
    expect(resolveToeicSelectedYear([...availableYears], 2025)).toBe(2025);
  });

  it("falls back to the latest available year", () => {
    expect(resolveToeicSelectedYear([2026], 2025)).toBe(2026);
  });

  it("returns null when no years are available", () => {
    expect(resolveToeicSelectedYear([], 2026)).toBeNull();
  });
});
