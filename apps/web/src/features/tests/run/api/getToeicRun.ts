import { apiRequest } from "@/shared/api/http";
import { parseToeicRunResult } from "@/features/tests/shared/api/parseToeicRunResult";

export function getToeicRun(token: string, sessionId: string) {
  return apiRequest(`/tests/runs/${sessionId}`, {
    method: "GET",
    token,
  }).then(parseToeicRunResult);
}
