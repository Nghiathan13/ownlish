import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord } from "@/shared/lib/parse";
import type { ToeicTestSummary } from "@/features/tests/shared/api/types";

function parseToeicPartProgress(value: unknown) {
  if (!isRecord(value) || !isNumber(value.partNumber)) {
    return null;
  }

  if (!isNumber(value.partCorrectCount) || !isNumber(value.partWrongCount)) {
    return null;
  }

  return {
    partNumber: value.partNumber,
    partCorrectCount: value.partCorrectCount,
    partWrongCount: value.partWrongCount,
  };
}

function parseTestSummary(value: unknown): ToeicTestSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNumber(value.id) ||
    !isNumber(value.year) ||
    !isNumber(value.testNumber) ||
    !Array.isArray(value.parts)
  ) {
    return null;
  }

  const parts = value.parts
    .map(parseToeicPartProgress)
    .filter((part): part is NonNullable<ReturnType<typeof parseToeicPartProgress>> => part !== null);

  return {
    id: value.id,
    year: value.year,
    testNumber: value.testNumber,
    parts,
  };
}

export async function listToeicTests(
  token: string,
  year = 2026,
  init?: RequestInit,
) {
  const body = await apiRequest(`/tests?year=${year}`, {
    ...init,
    token,
  });

  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  return body.items
    .map(parseTestSummary)
    .filter((item): item is ToeicTestSummary => item !== null);
}
