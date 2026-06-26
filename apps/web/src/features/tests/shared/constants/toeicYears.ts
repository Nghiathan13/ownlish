export const TOEIC_YEARS = [
  2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019,
] as const;

export type ToeicYear = (typeof TOEIC_YEARS)[number];

export const DEFAULT_TOEIC_YEAR: ToeicYear = 2026;

export function isToeicYear(value: number): value is ToeicYear {
  return TOEIC_YEARS.includes(value as ToeicYear);
}

export function parseToeicYearParam(
  value: string | null,
): ToeicYear | null {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && isToeicYear(parsed) ? parsed : null;
}

export function getTestsListPath(year: ToeicYear = DEFAULT_TOEIC_YEAR) {
  const params = new URLSearchParams({
    tab: "mock_tests",
    year: String(year),
  });

  return `/tests?${params.toString()}`;
}

export function getTestsListPathFromYearValue(year: number) {
  return getTestsListPath(isToeicYear(year) ? year : DEFAULT_TOEIC_YEAR);
}

export function getToeicYearButtonLabel(year: ToeicYear) {
  if (year === 2025) {
    return "YBM 2025";
  }

  return `ETS ${year}`;
}
