import { invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import { postToeicSession } from "@/features/tests/run/api/postToeicSession";
import { parseToeicQuestionGroup } from "@/features/tests/shared/api/parseToeicQuestionGroup";
import type {
  PracticeMode,
  PracticeSessionResult,
  ToeicQuestionGroup,
} from "@/features/tests/shared/api/types";

type CreateToeicSessionRequestParams = {
  token: string;
  testId: number;
  partNumbers: number[];
  mode: PracticeMode;
};

function parseToeicSessionResult(body: unknown): PracticeSessionResult {
  if (
    !isRecord(body) ||
    !isString(body.sessionId) ||
    (body.mode !== "practice" && body.mode !== "review_wrong") ||
    !isNumber(body.testId) ||
    !Array.isArray(body.partNumbers) ||
    !isNumber(body.correctCount) ||
    !isNumber(body.wrongCount) ||
    !Array.isArray(body.groups)
  ) {
    invalidApiResponse();
  }

  const partNumbers = body.partNumbers.filter(isNumber);
  const groups = body.groups
    .map(parseToeicQuestionGroup)
    .filter((group): group is ToeicQuestionGroup => group !== null);

  return {
    sessionId: body.sessionId,
    mode: body.mode,
    testId: body.testId,
    partNumbers,
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
    groups,
  };
}

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
