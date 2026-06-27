import type { AdminToeicTestListItem } from "@/features/admin/toeic/api/types";
import {
  TOEIC_YEARS,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";

export function getAdminToeicTestYears(): ToeicYear[] {
  return [...TOEIC_YEARS];
}

export function resolveAdminToeicSelectedYear(
  catalogYears: ToeicYear[],
  selectedYear: number | null,
): ToeicYear {
  if (
    selectedYear != null &&
    catalogYears.includes(selectedYear as ToeicYear)
  ) {
    return selectedYear as ToeicYear;
  }

  return catalogYears[0] ?? TOEIC_YEARS[0];
}

export function filterAdminToeicTestsByYear(
  tests: AdminToeicTestListItem[],
  year: ToeicYear | null,
): AdminToeicTestListItem[] {
  if (year == null) {
    return [];
  }

  return tests.filter((test) => test.year === year);
}
