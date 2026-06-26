import type { AdminToeicTestListItem } from "@/features/admin/toeic/api/types";

export function getAdminToeicTestYears(
  tests: AdminToeicTestListItem[],
): number[] {
  const years = new Set<number>();

  for (const test of tests) {
    years.add(test.year);
  }

  return [...years].sort((left, right) => right - left);
}

export function resolveAdminToeicSelectedYear(
  availableYears: number[],
  selectedYear: number | null,
): number | null {
  if (availableYears.length === 0) {
    return null;
  }

  if (selectedYear != null && availableYears.includes(selectedYear)) {
    return selectedYear;
  }

  return availableYears[0] ?? null;
}

export function filterAdminToeicTestsByYear(
  tests: AdminToeicTestListItem[],
  year: number | null,
): AdminToeicTestListItem[] {
  if (year == null) {
    return [];
  }

  return tests.filter((test) => test.year === year);
}
