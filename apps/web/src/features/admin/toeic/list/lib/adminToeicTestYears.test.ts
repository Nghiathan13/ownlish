import { describe, expect, it } from "vitest";
import {
  filterAdminToeicTestsByYear,
  getAdminToeicTestYears,
  resolveAdminToeicSelectedYear,
} from "@/features/admin/toeic/list/lib/adminToeicTestYears";
import type { AdminToeicTestListItem } from "@/features/admin/toeic/api/types";

const tests: AdminToeicTestListItem[] = [
  { id: 1, year: 2025, testNumber: 2, parts: [] },
  { id: 2, year: 2026, testNumber: 1, parts: [] },
  { id: 3, year: 2025, testNumber: 1, parts: [] },
];

describe("getAdminToeicTestYears", () => {
  it("returns unique years sorted descending", () => {
    expect(getAdminToeicTestYears(tests)).toEqual([2026, 2025]);
  });

  it("returns an empty list when there are no tests", () => {
    expect(getAdminToeicTestYears([])).toEqual([]);
  });
});

describe("resolveAdminToeicSelectedYear", () => {
  const availableYears = [2026, 2025];

  it("defaults to the latest year", () => {
    expect(resolveAdminToeicSelectedYear(availableYears, null)).toBe(2026);
  });

  it("keeps a valid selected year", () => {
    expect(resolveAdminToeicSelectedYear(availableYears, 2025)).toBe(2025);
  });

  it("falls back to the latest year when the selection disappears", () => {
    expect(resolveAdminToeicSelectedYear([2026], 2025)).toBe(2026);
  });

  it("returns null when no years are available", () => {
    expect(resolveAdminToeicSelectedYear([], 2026)).toBeNull();
  });
});

describe("filterAdminToeicTestsByYear", () => {
  it("filters tests for the selected year", () => {
    expect(filterAdminToeicTestsByYear(tests, 2025)).toEqual([
      tests[0],
      tests[2],
    ]);
  });

  it("returns an empty list when year is null", () => {
    expect(filterAdminToeicTestsByYear(tests, null)).toEqual([]);
  });
});
