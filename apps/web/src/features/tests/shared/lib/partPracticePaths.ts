import type { PracticeMode } from "@/entities/toeic-runtime/model/presentation";
import {
  DEFAULT_TOEIC_YEAR,
  parseToeicYearParam,
} from "@/features/tests/shared/constants/toeicYears";
import { isToeicPartNumber } from "@/features/tests/shared/lib/toeicParts";
import { isToeicSessionId } from "@/features/tests/shared/lib/toeicRunPaths";

export type TestsOverviewTab = "mock_tests" | "part_practice";

export function getPartPracticeRunPath(
  sessionId: string,
  mode: PracticeMode = "practice",
  partNumber?: number,
) {
  const params = new URLSearchParams({ mode });
  if (partNumber != null && isToeicPartNumber(partNumber)) {
    params.set("part", String(partNumber));
  }
  return `/tests/part-practice/${sessionId}?${params.toString()}`;
}

export function getTestsOverviewPath(options?: {
  year?: number;
  tab?: TestsOverviewTab;
  part?: number;
}) {
  const tab = options?.tab ?? "mock_tests";

  if (tab === "part_practice") {
    const params = new URLSearchParams({ tab: "part_practice" });

    if (options?.part != null && isToeicPartNumber(options.part)) {
      params.set("part", String(options.part));
    }

    return `/tests?${params.toString()}`;
  }

  const year = parseToeicYearParam(
    options?.year != null ? String(options.year) : null,
  ) ?? DEFAULT_TOEIC_YEAR;
  const params = new URLSearchParams({
    tab: "mock_tests",
    year: String(year),
  });

  return `/tests?${params.toString()}`;
}

export function parsePracticeOverviewPartParam(
  value: string | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && isToeicPartNumber(parsed) ? parsed : null;
}

export function parseTestsOverviewTab(
  value: string | null | undefined,
): TestsOverviewTab {
  if (value === "part_practice" || value === "practice") {
    return "part_practice";
  }

  return "mock_tests";
}

function buildCanonicalTestsOverviewPath(
  searchParams: Pick<URLSearchParams, "get">,
): string {
  const tab = parseTestsOverviewTab(searchParams.get("tab"));

  if (tab === "part_practice") {
    const params = new URLSearchParams({ tab: "part_practice" });
    const part = parsePracticeOverviewPartParam(searchParams.get("part"));

    if (part != null) {
      params.set("part", String(part));
    }

    return `/tests?${params.toString()}`;
  }

  const year = parseToeicYearParam(searchParams.get("year")) ?? DEFAULT_TOEIC_YEAR;

  return getTestsOverviewPath({ tab: "mock_tests", year });
}

export function getTestsOverviewRedirectTarget(
  searchParams: Pick<URLSearchParams, "get" | "toString">,
): string | null {
  const canonical = buildCanonicalTestsOverviewPath(searchParams);
  const query = searchParams.toString();
  const current = query ? `/tests?${query}` : "/tests";

  return current === canonical ? null : canonical;
}

const PART_PRACTICE_RUN_PATH =
  /^\/tests\/part-practice\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPartPracticeRunPath(pathname: string) {
  return PART_PRACTICE_RUN_PATH.test(pathname);
}

export function parsePartPracticeRunMode(
  value: string | null | undefined,
): PracticeMode {
  return value === "review_wrong" ? "review_wrong" : "practice";
}

export function parsePartPracticeRunPartParam(
  value: string | null | undefined,
): number | null {
  return parsePracticeOverviewPartParam(value);
}

export function isPartPracticeSessionId(value: string) {
  return isToeicSessionId(value);
}
