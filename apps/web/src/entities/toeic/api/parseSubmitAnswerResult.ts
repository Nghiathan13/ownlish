import { invalidApiResponse } from "@/shared/api/http";
import { isBoolean, isNullableString, isRecord, isString } from "@/shared/lib/parse";
import type { SubmitAnswerResult } from "./types";

export function parseSubmitAnswerResult(body: unknown): SubmitAnswerResult {
  if (!isRecord(body) || !isBoolean(body.graded)) {
    invalidApiResponse();
  }

  if (!body.graded) {
    return { graded: false };
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
  };
}
