import { apiRequest } from "@/shared/api/http";
import { parseToeicRunResult } from "@/features/tests/shared/api/parseToeicRunResult";

export function finishToeicRun(token: string, sessionId: string) {
  return apiRequest(`/tests/runs/${sessionId}/finish`, {
    method: "PATCH",
    token,
  }).then(parseToeicRunResult);
}
