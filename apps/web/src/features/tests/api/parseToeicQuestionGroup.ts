import {
  isNullableString,
  isNumber,
  isRecord,
} from "@/shared/lib/parse";
import type {
  ToeicQuestion,
  ToeicQuestionGroup,
  ToeicQuestionOptions,
} from "@/features/tests/api/types";

function parseOptions(value: unknown): ToeicQuestionOptions | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    A: isNullableString(value.A) ? value.A : null,
    B: isNullableString(value.B) ? value.B : null,
    C: isNullableString(value.C) ? value.C : null,
    D: isNullableString(value.D) ? value.D : null,
    A_vi: isNullableString(value.A_vi) ? value.A_vi : null,
    B_vi: isNullableString(value.B_vi) ? value.B_vi : null,
    C_vi: isNullableString(value.C_vi) ? value.C_vi : null,
    D_vi: isNullableString(value.D_vi) ? value.D_vi : null,
  };
}

function parseQuestion(value: unknown): ToeicQuestion | null {
  if (!isRecord(value)) {
    return null;
  }

  const options = parseOptions(value.options);
  const rawAnswerKey =
    typeof value.answerKey === "string"
      ? value.answerKey.trim().toUpperCase()
      : null;
  const answerKey =
    rawAnswerKey === "A" ||
    rawAnswerKey === "B" ||
    rawAnswerKey === "C" ||
    rawAnswerKey === "D"
      ? rawAnswerKey
      : null;

  if (
    !isNumber(value.id) ||
    !isNumber(value.questionNumber) ||
    !options ||
    !isNumber(value.optionCount)
  ) {
    return null;
  }

  return {
    id: value.id,
    questionNumber: value.questionNumber,
    question: isNullableString(value.question) ? value.question : null,
    questionVi: isNullableString(value.questionVi) ? value.questionVi : null,
    options,
    optionCount: value.optionCount,
    answerKey,
  };
}

export function parseToeicQuestionGroup(
  value: unknown,
): ToeicQuestionGroup | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isNumber(value.id) || !Array.isArray(value.questions)) {
    return null;
  }

  const questions = value.questions
    .map(parseQuestion)
    .filter((question): question is ToeicQuestion => question !== null);

  return {
    id: value.id,
    partNumber: isNumber(value.partNumber) ? value.partNumber : null,
    questionStart: isNumber(value.questionStart) ? value.questionStart : 0,
    questionEnd: isNumber(value.questionEnd) ? value.questionEnd : 0,
    groupType: isNullableString(value.groupType) ? value.groupType : null,
    accent: isNullableString(value.accent) ? value.accent : null,
    content: isNullableString(value.content) ? value.content : null,
    contentVi: isNullableString(value.contentVi) ? value.contentVi : null,
    audioUrl: isNullableString(value.audioUrl) ? value.audioUrl : null,
    audioUrlExpiresAt: isNullableString(value.audioUrlExpiresAt)
      ? value.audioUrlExpiresAt
      : null,
    imageUrl: isNullableString(value.imageUrl) ? value.imageUrl : null,
    imageUrlExpiresAt: isNullableString(value.imageUrlExpiresAt)
      ? value.imageUrlExpiresAt
      : null,
    questions,
  };
}
