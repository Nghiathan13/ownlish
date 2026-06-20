import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord } from "@/shared/lib/parse";
import type { CompleteSessionResult } from "@/features/tests/shared/api/types";

export async function completeToeicSession(token: string, sessionId: string) {
  const body = await apiRequest(
    `/tests/practice/sessions/${sessionId}/complete`,
    {
      method: "PATCH",
      token,
    },
  );

  if (
    !isRecord(body) ||
    !isNumber(body.correctCount) ||
    !isNumber(body.wrongCount)
  ) {
    invalidApiResponse();
  }

  return {
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
  } satisfies CompleteSessionResult;
}
