import { postToeicRun } from "@/features/tests/run/api/postToeicRun";
import { parseToeicRunResult } from "@/features/tests/shared/api/parseToeicRunResult";
import type {
  ToeicRunResult,
  ToeicRunMode,
} from "@/features/tests/shared/api/types";

type CreateToeicRunRequestParams = {
  token: string;
  testId: number;
  partNumbers: number[];
  mode: ToeicRunMode;
};

export function createToeicRunRequest({
  token,
  testId,
  partNumbers,
  mode,
}: CreateToeicRunRequestParams): Promise<ToeicRunResult> {
  return postToeicRun(token, {
    testId,
    partNumbers,
    mode,
  }).then(parseToeicRunResult);
}
