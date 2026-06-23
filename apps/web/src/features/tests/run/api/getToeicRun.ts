import { apiRequest } from "@/shared/api/http";
import { parseToeicRunResult } from "@/features/tests/shared/api/parseToeicRunResult";
import type { PracticeMode } from "@/features/tests/shared/api/types";
import { getToeicRunApiPath } from "@/features/tests/shared/lib/toeicRunPaths";

type GetToeicRunOptions = {
  mode?: PracticeMode;
  parts?: number[];
};

export function getToeicRun(
  token: string,
  sessionId: string,
  options?: GetToeicRunOptions,
) {
  return apiRequest(getToeicRunApiPath(sessionId, options), {
    method: "GET",
    token,
  }).then(parseToeicRunResult);
}
