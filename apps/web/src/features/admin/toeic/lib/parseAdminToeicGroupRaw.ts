import { invalidApiResponse } from "@/shared/api/http";
import {
  isNullableString,
  isNumber,
  isRecord,
} from "@/shared/lib/parse";
import type {
  AdminToeicAnswerKey,
  AdminToeicGroupRaw,
  AdminToeicGroupRawPayload,
  AdminToeicGroupRawQuestion,
} from "@/features/admin/toeic/api/types";

function parseAnswerKey(value: unknown): AdminToeicAnswerKey {
  if (value === null) {
    return null;
  }

  if (value === "A" || value === "B" || value === "C" || value === "D") {
    return value;
  }

  invalidApiResponse();
}

function parseQuestion(body: unknown): AdminToeicGroupRawQuestion {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    questionNumber,
    question,
    questionVi,
    questionType,
    optionA,
    optionB,
    optionC,
    optionD,
    optionAVi,
    optionBVi,
    optionCVi,
    optionDVi,
    answerKey,
    explanationVi,
  } = body;

  if (!isNumber(id) || !isNumber(questionNumber)) {
    invalidApiResponse();
  }

  if (
    !isNullableString(question) ||
    !isNullableString(questionVi) ||
    !isNullableString(questionType) ||
    !isNullableString(optionA) ||
    !isNullableString(optionB) ||
    !isNullableString(optionC) ||
    !isNullableString(optionD) ||
    !isNullableString(optionAVi) ||
    !isNullableString(optionBVi) ||
    !isNullableString(optionCVi) ||
    !isNullableString(optionDVi) ||
    !isNullableString(explanationVi)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    questionNumber,
    question,
    questionVi,
    questionType,
    optionA,
    optionB,
    optionC,
    optionD,
    optionAVi,
    optionBVi,
    optionCVi,
    optionDVi,
    answerKey: parseAnswerKey(answerKey),
    explanationVi,
  };
}

function parseGroup(body: unknown): AdminToeicGroupRaw {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    testId,
    partNumber,
    questionStart,
    questionEnd,
    groupType,
    accent,
    content,
    contentVi,
    audioStoragePath,
    imageStoragePath,
    questions,
  } = body;

  if (
    !isNumber(id) ||
    !isNumber(testId) ||
    !isNumber(partNumber) ||
    !isNumber(questionStart) ||
    !isNumber(questionEnd) ||
    !Array.isArray(questions)
  ) {
    invalidApiResponse();
  }

  if (
    !isNullableString(groupType) ||
    !isNullableString(accent) ||
    !isNullableString(content) ||
    !isNullableString(contentVi) ||
    !isNullableString(audioStoragePath) ||
    !isNullableString(imageStoragePath)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    testId,
    partNumber,
    questionStart,
    questionEnd,
    groupType,
    accent,
    content,
    contentVi,
    audioStoragePath,
    imageStoragePath,
    questions: questions.map(parseQuestion),
  };
}

export function parseAdminToeicGroupRawPayload(
  body: unknown,
): AdminToeicGroupRawPayload {
  if (!isRecord(body) || !("group" in body)) {
    invalidApiResponse();
  }

  return {
    group: parseGroup(body.group),
  };
}
