import { apiRequest } from "@/shared/api/http";
import { normalizeSelectedParts } from "@/features/tests/shared/lib/toeicParts";
import { getExpandToeicRunPartsApiPath } from "@/features/tests/shared/lib/toeicRunPaths";

export function expandToeicRunParts(
  accessToken: string,
  sessionId: string,
  parts: number[],
) {
  return apiRequest(getExpandToeicRunPartsApiPath(sessionId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      partNumbers: normalizeSelectedParts(parts),
    }),
  });
}
