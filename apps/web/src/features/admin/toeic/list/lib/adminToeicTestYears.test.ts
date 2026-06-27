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
  it("returns the full TOEIC catalog in descending order", () => {
    expect(getAdminToeicTestYears()).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019,
    ]);
  });
});

describe("resolveAdminToeicSelectedYear", () => {
  const catalogYears = getAdminToeicTestYears();

  it("defaults to the latest catalog year", () => {
    expect(resolveAdminToeicSelectedYear(catalogYears, null)).toBe(2026);
  });

  it("keeps a valid selected year", () => {
    expect(resolveAdminToeicSelectedYear(catalogYears, 2025)).toBe(2025);
  });

  it("falls back to the latest catalog year when the selection is unknown", () => {
    expect(resolveAdminToeicSelectedYear(catalogYears, 1999)).toBe(2026);
  });
});

describe("filterAdminToeicTestsByYear", () => {
  it("filters tests for the selected year", () => {
    expect(filterAdminToeicTestsByYear(tests, 2025)).toEqual([
      tests[0],
      tests[2],
    ]);
  });

  it("returns an empty list when the year has no tests", () => {
    expect(filterAdminToeicTestsByYear(tests, 2024)).toEqual([]);
  });

  it("returns an empty list when year is null", () => {
    expect(filterAdminToeicTestsByYear(tests, null)).toEqual([]);
  });
});
