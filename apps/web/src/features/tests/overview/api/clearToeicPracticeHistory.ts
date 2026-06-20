import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord } from "@/shared/lib/parse";

export async function clearToeicPracticeHistory(token: string, testId: number) {
  const body = await apiRequest(`/tests/${testId}/practice-history`, {
    method: "DELETE",
    token,
  });

  if (!isRecord(body) || !isNumber(body.deletedSessionCount)) {
    invalidApiResponse();
  }

  return { deletedSessionCount: body.deletedSessionCount };
}
