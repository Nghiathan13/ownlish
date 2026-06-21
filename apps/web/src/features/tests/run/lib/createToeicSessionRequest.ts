import { postToeicSession } from "@/features/tests/run/api/postToeicSession";
import { parseToeicSessionResult } from "@/features/tests/shared/api/parseToeicSessionResult";
import type {
  PracticeSessionResult,
  ToeicRunMode,
} from "@/features/tests/shared/api/types";

type CreateToeicSessionRequestParams = {
  token: string;
  testId: number;
  partNumbers: number[];
  mode: ToeicRunMode;
};

export function createToeicSessionRequest({
  token,
  testId,
  partNumbers,
  mode,
}: CreateToeicSessionRequestParams): Promise<PracticeSessionResult> {
  return postToeicSession(token, {
    testId,
    partNumbers,
    mode,
  }).then(parseToeicSessionResult);
}
