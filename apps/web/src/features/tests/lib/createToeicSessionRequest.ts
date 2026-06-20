import { invalidApiResponse } from "@/shared/api/http";
import { isBoolean, isNumber, isRecord, isString } from "@/shared/lib/parse";
import { postToeicSession } from "@/features/tests/api/postToeicSession";
import { parseToeicQuestionGroup } from "@/features/tests/api/parseToeicQuestionGroup";
import type {
  PracticeMode,
  PracticeSessionAnswer,
  PracticeSessionResult,
  ToeicQuestionGroup,
} from "@/features/tests/api/types";
import { runAuthenticatedRequest } from "@/features/auth/lib/authRequest";

type CreateToeicSessionRequestParams = {
  accessToken: string | null;
  clearSession: () => void;
  testId: number;
  partNumbers: number[];
  mode: PracticeMode;
};

function isOptionKey(value: string): value is "A" | "B" | "C" | "D" {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function parseToeicSessionAnswers(value: unknown): PracticeSessionAnswer[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((answer) => {
    if (!isRecord(answer)) {
      return [];
    }

    const selectedKey = isString(answer.selectedKey)
      ? answer.selectedKey.trim().toUpperCase()
      : "";

    if (!isNumber(answer.toeicQuestionId) || !isOptionKey(selectedKey)) {
      return [];
    }

    const answerKey = isString(answer.answerKey)
      ? answer.answerKey.trim().toUpperCase()
      : "";

    if (!isOptionKey(answerKey) || !isBoolean(answer.isCorrect)) {
      return [
        {
          toeicQuestionId: answer.toeicQuestionId,
          selectedKey,
        },
      ];
    }

    return [
      {
        toeicQuestionId: answer.toeicQuestionId,
        selectedKey,
        answerKey,
        isCorrect: answer.isCorrect,
      },
    ];
  });
}

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
    answers: parseToeicSessionAnswers(body.answers),
  };
}

export function createToeicSessionRequest({
  accessToken,
  clearSession,
  testId,
  partNumbers,
  mode,
}: CreateToeicSessionRequestParams): Promise<PracticeSessionResult> {
  return runAuthenticatedRequest({
    accessToken,
    clearSession,
    request: async (token) => {
      const body = await postToeicSession(token, {
        testId,
        partNumbers,
        mode,
      });

      return parseToeicSessionResult(body);
    },
  });
}
