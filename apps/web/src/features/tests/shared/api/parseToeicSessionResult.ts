import { invalidApiResponse } from "../../../../shared/api/http";
import { isNullableString, isNumber, isRecord, isString } from "../../../../shared/lib/parse";
import { parseToeicQuestionGroup } from "./parseToeicQuestionGroup";
import type {
  PracticeSessionResult,
  ToeicQuestionGroup,
  ToeicRunMode,
} from "./types";

function parseRunMode(value: unknown): ToeicRunMode | null {
  return value === "practice" || value === "review_wrong" || value === "mock_test"
    ? value
    : null;
}

export function parseToeicSessionResult(body: unknown): PracticeSessionResult {
  const mode = isRecord(body) ? parseRunMode(body.mode) : null;

  if (
    !isRecord(body) ||
    !isString(body.sessionId) ||
    !mode ||
    !isNumber(body.testId) ||
    !Array.isArray(body.partNumbers) ||
    !isNumber(body.totalQuestions) ||
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
    mode,
    testId: body.testId,
    partNumbers,
    totalQuestions: body.totalQuestions,
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
    completedAt: isNullableString(body.completedAt) ? body.completedAt : null,
    groups,
  };
}
