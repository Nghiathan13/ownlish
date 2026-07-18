import type { PracticeMode, ToeicRunMode } from "@/features/tests/shared/api/types";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";

type ToeicRunPathMode = PracticeMode | "mock_test";

export function getToeicRunPath(
  sessionId: string,
  mode: ToeicRunPathMode,
  parts: number[],
  testKey?: string,
) {
  const normalizedParts = normalizeSelectedParts(parts);
  const testParam = testKey ? `&test=${encodeURIComponent(testKey)}` : "";

  return `/tests/${sessionId}/${mode}?parts=${normalizedParts.join(",")}${testParam}`;
}

export function getToeicRunApiPath(
  sessionId: string,
  options?: {
    mode?: PracticeMode;
    parts?: number[];
  },
) {
  const params = new URLSearchParams();

  if (options?.parts?.length) {
    params.set("parts", normalizeSelectedParts(options.parts).join(","));
  }

  if (options?.mode) {
    params.set("mode", options.mode);
  }

  const query = params.toString();

  return query
    ? `/tests/runs/${sessionId}?${query}`
    : `/tests/runs/${sessionId}`;
}

export function getExpandToeicRunPartsApiPath(sessionId: string) {
  return `/tests/runs/${sessionId}/expand-parts`;
}

export function parseToeicRunPartsParam(
  value: string | null | undefined,
): number[] {
  if (!value) {
    return [];
  }

  const parsed = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isInteger(part) && part > 0);

  return normalizeSelectedParts(parsed);
}

export function parseToeicRunTestKeyParam(
  value: string | null | undefined,
) {
  return value && value.trim().length > 0 ? value : null;
}

export function isToeicRunMode(value: string): value is ToeicRunMode {
  return value === "practice" || value === "review_wrong" || value === "mock_test";
}

const TOEIC_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isToeicSessionId(value: string) {
  return TOEIC_SESSION_ID_PATTERN.test(value);
}
