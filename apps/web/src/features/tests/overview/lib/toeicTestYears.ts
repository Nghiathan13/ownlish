import {
  TOEIC_YEARS,
  type ToeicYear,
} from "@/features/tests/shared/constants/toeicYears";

export function getToeicTestYears(years: number[]): ToeicYear[] {
  const available = new Set(years);

  return TOEIC_YEARS.filter((year) => available.has(year)).sort(
    (left, right) => right - left,
  );
}

export function resolveToeicSelectedYear(
  availableYears: ToeicYear[],
  selectedYear: ToeicYear,
): ToeicYear | null {
  if (availableYears.length === 0) {
    return null;
  }

  if (availableYears.includes(selectedYear)) {
    return selectedYear;
  }

  return availableYears[0] ?? null;
}
