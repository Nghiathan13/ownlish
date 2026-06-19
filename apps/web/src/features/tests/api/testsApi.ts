import { apiRequest, invalidApiResponse } from "@/shared/api/http";
import {
  isBoolean,
  isNullableString,
  isNumber,
  isRecord,
  isString,
} from "@/shared/lib/parse";
import type {
  CompleteSessionResult,
  RefreshMediaGroup,
  SubmitAnswerResult,
  ToeicPartResponse,
  ToeicQuestion,
  ToeicQuestionGroup,
  ToeicQuestionOptions,
} from "./types";

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

export function parseToeicQuestionGroup(value: unknown): ToeicQuestionGroup | null {
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

export async function getTestPart(
  token: string,
  testId: number,
  partNumber: number,
  init?: RequestInit,
) {
  const body = await apiRequest(`/tests/${testId}/parts/${partNumber}`, {
    ...init,
    token,
  });

  if (!isRecord(body) || !Array.isArray(body.groups)) {
    invalidApiResponse();
  }

  const groups = body.groups
    .map(parseToeicQuestionGroup)
    .filter((group): group is ToeicQuestionGroup => group !== null);

  if (
    !isNumber(body.testId) ||
    !isNumber(body.partNumber) ||
    (body.skill !== "listening" && body.skill !== "reading")
  ) {
    invalidApiResponse();
  }

  return {
    testId: body.testId,
    partNumber: body.partNumber,
    skill: body.skill,
    groups,
  } satisfies ToeicPartResponse;
}

function isOptionKey(value: string): value is "A" | "B" | "C" | "D" {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

export async function submitPracticeAnswer(
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

export async function submitReviewGroupAnswers(
  token: string,
  sessionId: string,
  groupId: number,
  payload: {
    answers: Array<{
      toeicQuestionId: number;
      selectedKey: "A" | "B" | "C" | "D";
    }>;
  },
) {
  const body = await apiRequest(
    `/tests/practice/sessions/${sessionId}/groups/${groupId}/answers`,
    {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    },
  );

  if (!isRecord(body) || !Array.isArray(body.results)) {
    invalidApiResponse();
  }

  const results = body.results.flatMap((value) => {
    if (!isRecord(value) || !isNumber(value.toeicQuestionId)) {
      return [];
    }

    if (!isBoolean(value.graded) || !value.graded) {
      return [];
    }

    if (!isBoolean(value.isCorrect) || !isString(value.answerKey)) {
      return [];
    }

    const answerKey = value.answerKey.trim().toUpperCase();
    if (!isOptionKey(answerKey)) {
      return [];
    }

    return [
      {
        toeicQuestionId: value.toeicQuestionId,
        graded: true as const,
        isCorrect: value.isCorrect,
        answerKey,
        correctOptionEn: isNullableString(value.correctOptionEn)
          ? value.correctOptionEn
          : null,
        correctOptionVi: isNullableString(value.correctOptionVi)
          ? value.correctOptionVi
          : null,
      },
    ];
  });

  return { results };
}

export async function completePracticeSession(
  token: string,
  sessionId: string,
) {
  const body = await apiRequest(
    `/tests/practice/sessions/${sessionId}/complete`,
    {
      method: "PATCH",
      token,
    },
  );

  if (
    !isRecord(body) ||
    !isNumber(body.correctCount) ||
    !isNumber(body.wrongCount)
  ) {
    invalidApiResponse();
  }

  return {
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
  } satisfies CompleteSessionResult;
}

export async function clearTestPracticeHistory(token: string, testId: number) {
  const body = await apiRequest(`/tests/${testId}/practice-history`, {
    method: "DELETE",
    token,
  });

  if (!isRecord(body) || !isNumber(body.deletedSessionCount)) {
    invalidApiResponse();
  }

  return { deletedSessionCount: body.deletedSessionCount };
}

function parseRefreshGroup(value: unknown): RefreshMediaGroup | null {
  if (!isRecord(value) || !isNumber(value.id)) {
    return null;
  }

  return {
    id: value.id,
    audioUrl: isNullableString(value.audioUrl) ? value.audioUrl : null,
    audioUrlExpiresAt: isNullableString(value.audioUrlExpiresAt)
      ? value.audioUrlExpiresAt
      : null,
    imageUrl: isNullableString(value.imageUrl) ? value.imageUrl : null,
    imageUrlExpiresAt: isNullableString(value.imageUrlExpiresAt)
      ? value.imageUrlExpiresAt
      : null,
  };
}

export async function refreshTestPartMedia(
  token: string,
  testId: number,
  partNumber: number,
  groupIds?: number[],
) {
  const body = await apiRequest(
    `/tests/${testId}/parts/${partNumber}/refresh-media`,
    {
      method: "POST",
      token,
      body: JSON.stringify(groupIds?.length ? { groupIds } : {}),
    },
  );

  if (!isRecord(body) || !Array.isArray(body.groups)) {
    invalidApiResponse();
  }

  return body.groups
    .map(parseRefreshGroup)
    .filter((group): group is RefreshMediaGroup => group !== null);
}
