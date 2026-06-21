import { apiRequest } from "@/shared/api/http";
import { parseToeicSessionResult } from "@/features/tests/shared/api/parseToeicSessionResult";

export function finishToeicRun(token: string, sessionId: string) {
  return apiRequest(`/tests/runs/${sessionId}/finish`, {
    method: "PATCH",
    token,
  }).then(parseToeicSessionResult);
}
