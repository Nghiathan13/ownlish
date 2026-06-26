import type { PracticeMode } from "@/entities/toeic/api/types";
import {
  DEFAULT_TOEIC_YEAR,
  getTestsListPath,
  parseToeicYearParam,
} from "@/features/tests/shared/constants/toeicYears";
import { isToeicPartNumber } from "@/features/tests/shared/lib/toeicParts";
import { isToeicSessionId } from "@/features/tests/shared/lib/toeicRunPaths";

export function getPartPracticeRunPath(
  sessionId: string,
  mode: PracticeMode = "practice",
) {
  const params = new URLSearchParams({ mode });
  return `/tests/part-practice/${sessionId}?${params.toString()}`;
}

export function getPartPracticeRunApiPath(
  sessionId: string,
  options?: { mode?: PracticeMode },
) {
  const params = new URLSearchParams();

  if (options?.mode) {
    params.set("mode", options.mode);
  }

  const query = params.toString();

  return query
    ? `/tests/part-practice/runs/${sessionId}?${query}`
    : `/tests/part-practice/runs/${sessionId}`;
}

export function getTestsOverviewPath(options?: {
  year?: number;
  tab?: "mock" | "practice";
  part?: number;
}) {
  const params = new URLSearchParams();

  if (options?.year != null) {
    params.set("year", String(options.year));
  }

  if (options?.tab === "practice") {
    params.set("tab", "practice");
  }

  if (options?.part != null && isToeicPartNumber(options.part)) {
    params.set("part", String(options.part));
  }

  const query = params.toString();
  return query ? `/tests?${query}` : "/tests";
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
): "mock" | "practice" {
  return value === "practice" ? "practice" : "mock";
}

export function getTestsOverviewRedirectTarget(
  searchParams: Pick<URLSearchParams, "get">,
): string | null {
  const tab = parseTestsOverviewTab(searchParams.get("tab"));

  if (tab === "practice") {
    return null;
  }

  const yearParam = searchParams.get("year");
  const year = parseToeicYearParam(yearParam) ?? DEFAULT_TOEIC_YEAR;

  if (yearParam === String(year)) {
    return null;
  }

  return getTestsListPath(year);
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

export function isPartPracticeSessionId(value: string) {
  return isToeicSessionId(value);
}
