import { apiRequest } from "@/shared/api/http";
import { parseToeicSessionResult } from "@/features/tests/shared/api/parseToeicSessionResult";

export function getToeicRun(token: string, sessionId: string) {
  return apiRequest(`/tests/runs/${sessionId}`, {
    method: "GET",
    token,
  }).then(parseToeicSessionResult);
}
