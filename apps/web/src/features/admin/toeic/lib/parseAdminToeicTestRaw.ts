import { invalidApiResponse } from "@/shared/api/http";
import {
  isNullableString,
  isNumber,
  isRecord,
} from "@/shared/lib/parse";
import type {
  AdminToeicAnswerKey,
  AdminToeicTestRawGroup,
  AdminToeicTestRawPart,
  AdminToeicTestRawQuestion,
  AdminToeicTestRawResponse,
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

function parseQuestion(body: unknown): AdminToeicTestRawQuestion {
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

function parseGroup(body: unknown): AdminToeicTestRawGroup {
  if (!isRecord(body)) invalidApiResponse();

  const {
    id,
    questionStart,
    questionEnd,
    groupType,
    accent,
    content,
    contentVi,
    audioUrl,
    audioUrlExpiresAt,
    imageUrl,
    imageUrlExpiresAt,
    questions,
  } = body;

  if (
    !isNumber(id) ||
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
    !isNullableString(audioUrl) ||
    !isNullableString(audioUrlExpiresAt) ||
    !isNullableString(imageUrl) ||
    !isNullableString(imageUrlExpiresAt)
  ) {
    invalidApiResponse();
  }

  return {
    id,
    questionStart,
    questionEnd,
    groupType,
    accent,
    content,
    contentVi,
    audioUrl,
    audioUrlExpiresAt,
    imageUrl,
    imageUrlExpiresAt,
    questions: questions.map(parseQuestion),
  };
}

function parsePart(body: unknown): AdminToeicTestRawPart {
  if (!isRecord(body)) invalidApiResponse();

  const { partNumber, groups } = body;

  if (!isNumber(partNumber) || !Array.isArray(groups)) {
    invalidApiResponse();
  }

  return {
    partNumber,
    groups: groups.map(parseGroup),
  };
}

export function parseAdminToeicTestRawResponse(
  body: unknown,
): AdminToeicTestRawResponse {
  if (!isRecord(body) || !isRecord(body.test) || !Array.isArray(body.parts)) {
    invalidApiResponse();
  }

  const { id, year, testNumber } = body.test;

  if (!isNumber(id) || !isNumber(year) || !isNumber(testNumber)) {
    invalidApiResponse();
  }

  return {
    test: { id, year, testNumber },
    parts: body.parts.map(parsePart),
  };
}
