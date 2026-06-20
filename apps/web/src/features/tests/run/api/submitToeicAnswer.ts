import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isBoolean,
  isNullableString,
  isRecord,
  isString,
} from "@/shared/lib/parse";
import type { SubmitAnswerResult } from "@/features/tests/shared/api/types";

export async function submitToeicAnswer(
  token: string,
  sessionId: string,
  payload: {
    toeicQuestionId: number;
    selectedKey: "A" | "B" | "C" | "D";
  },
) {
  const body = await apiRequest(
    `/tests/practice/sessions/${sessionId}/answers`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );

  if (!isRecord(body) || !isBoolean(body.graded)) {
    invalidApiResponse();
  }

  if (!body.graded) {
    return {
      graded: false,
    } satisfies SubmitAnswerResult;
  }

  if (!isBoolean(body.isCorrect) || !isString(body.answerKey)) {
    invalidApiResponse();
  }

  return {
    graded: true,
    isCorrect: body.isCorrect,
    answerKey: body.answerKey as SubmitAnswerResult["answerKey"],
    correctOptionEn: isNullableString(body.correctOptionEn)
      ? body.correctOptionEn
      : null,
    correctOptionVi: isNullableString(body.correctOptionVi)
      ? body.correctOptionVi
      : null,
  } satisfies SubmitAnswerResult;
}
