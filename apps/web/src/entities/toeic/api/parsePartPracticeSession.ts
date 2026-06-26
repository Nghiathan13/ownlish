import { invalidApiResponse } from "@/shared/api/http";
import { isNumber, isRecord, isString } from "@/shared/lib/parse";
import { parsePartPracticeQuestionGroup } from "./parsePartPracticeQuestionGroup";
import type { PartPracticeSessionResult, PracticeMode } from "./types";

function parsePracticeMode(value: unknown): PracticeMode | null {
  return value === "practice" || value === "review_wrong" ? value : null;
}

export function parsePartPracticeSession(body: unknown): PartPracticeSessionResult {
  const mode = isRecord(body) ? parsePracticeMode(body.mode) : null;

  if (
    !isRecord(body) ||
    !isString(body.sessionId) ||
    !mode ||
    !isNumber(body.partNumber) ||
    !isNumber(body.totalQuestions) ||
    !isNumber(body.correctCount) ||
    !isNumber(body.wrongCount) ||
    !Array.isArray(body.groups)
  ) {
    invalidApiResponse();
  }

  const groups = body.groups
    .map(parsePartPracticeQuestionGroup)
    .filter(
      (group): group is NonNullable<ReturnType<typeof parsePartPracticeQuestionGroup>> =>
        group !== null,
    );

  return {
    sessionId: body.sessionId,
    mode,
    partNumber: body.partNumber,
    totalQuestions: body.totalQuestions,
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
    groups,
  };
}
