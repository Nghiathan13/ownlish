/** Newest first. Default year is the first entry. */
export const TOEIC_YEAR_SERIES = [
  { year: 2026, label: "ETS 2026" },
  { year: 2025, label: "YBM 2025" },
  { year: 2024, label: "ETS 2024" },
  { year: 2023, label: "ETS 2023" },
  { year: 2022, label: "ETS 2022" },
  { year: 2021, label: "ETS 2021" },
  { year: 2020, label: "ETS 2020" },
  { year: 2019, label: "ETS 2019" },
] as const;

export type ToeicYear = (typeof TOEIC_YEAR_SERIES)[number]["year"];

export const TOEIC_YEARS: readonly ToeicYear[] = TOEIC_YEAR_SERIES.map(
  (item) => item.year,
);

export const DEFAULT_TOEIC_YEAR: ToeicYear = TOEIC_YEAR_SERIES[0].year;

export function isToeicYear(value: number): value is ToeicYear {
  return TOEIC_YEARS.includes(value as ToeicYear);
}

export function parseToeicYearParam(value: string | null): ToeicYear | null {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && isToeicYear(parsed) ? parsed : null;
}

export function getTestsListPath(year: ToeicYear = DEFAULT_TOEIC_YEAR) {
  const params = new URLSearchParams({ year: String(year) });

  return `/tests/mock-tests?${params.toString()}`;
}

export function getTestsListPathFromYearValue(year: number) {
  return getTestsListPath(isToeicYear(year) ? year : DEFAULT_TOEIC_YEAR);
}

export function getToeicYearButtonLabel(year: ToeicYear) {
  return (
    TOEIC_YEAR_SERIES.find((item) => item.year === year)?.label ?? `ETS ${year}`
  );
}
