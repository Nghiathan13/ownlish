import { invalidApiResponse } from "@/shared/api/http";
import { isBoolean, isNumber, isRecord, isString } from "@/shared/lib/parse";
import { postToeicSession } from "@/features/tests/api/postToeicSession";
import type {
  PracticeMode,
  PracticeSessionAnswer,
  PracticeSessionResult,
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
    !isNumber(body.correctCount) ||
    !isNumber(body.wrongCount)
  ) {
    invalidApiResponse();
  }

  return {
    sessionId: body.sessionId,
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
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
