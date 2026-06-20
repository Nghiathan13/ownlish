import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord } from "@/shared/lib/parse";
import { parseToeicQuestionGroup } from "@/features/tests/api/parseToeicQuestionGroup";
import type {
  ToeicPartResponse,
  ToeicQuestionGroup,
} from "@/features/tests/api/types";

export async function getToeicTestPart(
  token: string,
  testId: number,
  partNumber: number,
  init?: RequestInit,
) {
  const body = await apiRequest(`/tests/${testId}/parts/${partNumber}`, {
    ...init,
    token,
  });

  if (!isRecord(body) || !Array.isArray(body.groups)) {
    invalidApiResponse();
  }

  const groups = body.groups
    .map(parseToeicQuestionGroup)
    .filter((group): group is ToeicQuestionGroup => group !== null);

  if (
    !isNumber(body.testId) ||
    !isNumber(body.partNumber) ||
    (body.skill !== "listening" && body.skill !== "reading")
  ) {
    invalidApiResponse();
  }

  return {
    testId: body.testId,
    partNumber: body.partNumber,
    skill: body.skill,
    groups,
  } satisfies ToeicPartResponse;
}
