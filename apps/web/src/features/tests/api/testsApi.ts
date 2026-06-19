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
  PracticeSessionResult,
  PracticeStats,
  RefreshMediaGroup,
  SubmitAnswerResult,
  ToeicPartResponse,
  ToeicQuestion,
  ToeicQuestionGroup,
  ToeicQuestionOptions,
  ToeicTestSummary,
  WrongQuestionItem,
  TestAttemptDetail,
  TestAttemptListResult,
  TestAttemptSummary,
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

function parseGroup(value: unknown): ToeicQuestionGroup | null {
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

function parseTestSummary(value: unknown): ToeicTestSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNumber(value.id) ||
    !isNumber(value.year) ||
    !isNumber(value.testNumber) ||
    !isString(value.label)
  ) {
    return null;
  }

  return {
    id: value.id,
    year: value.year,
    testNumber: value.testNumber,
    label: value.label,
  };
}

export async function listTests(
  token: string,
  year = 2026,
  init?: RequestInit,
) {
  const body = await apiRequest(`/tests?year=${year}`, {
    ...init,
    token,
  });

  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  return body.items
    .map(parseTestSummary)
    .filter((item): item is ToeicTestSummary => item !== null);
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
    .map(parseGroup)
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

export async function createPracticeSession(
  token: string,
  payload: {
    testId: number;
    partNumber?: number;
    partNumbers?: number[];
    mode?: "normal" | "wrong_questions";
  },
) {
  const body = await apiRequest("/tests/practice/sessions", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });

  if (!isRecord(body) || !isString(body.sessionId)) {
    invalidApiResponse();
  }

  const answers = Array.isArray(body.answers)
    ? body.answers.flatMap((value) => {
        if (!isRecord(value)) {
          return [];
        }

        const selectedKey = isString(value.selectedKey)
          ? value.selectedKey.trim().toUpperCase()
          : "";

        if (!isNumber(value.toeicQuestionId) || !isOptionKey(selectedKey)) {
          return [];
        }

        const answerKey = isString(value.answerKey)
          ? value.answerKey.trim().toUpperCase()
          : "";

        if (!isOptionKey(answerKey) || !isBoolean(value.isCorrect)) {
          return [
            {
              toeicQuestionId: value.toeicQuestionId,
              selectedKey,
            },
          ];
        }

        return [
          {
            toeicQuestionId: value.toeicQuestionId,
            selectedKey,
            answerKey,
            isCorrect: value.isCorrect,
          },
        ];
      })
    : [];

  if (
    !isNumber(body.correctCount) ||
    !isNumber(body.wrongCount)
  ) {
    invalidApiResponse();
  }

  return {
    sessionId: body.sessionId,
    correctCount: body.correctCount,
    wrongCount: body.wrongCount,
    answers,
  } satisfies PracticeSessionResult;
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

function parseWrongQuestionItem(value: unknown): WrongQuestionItem | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    !isNumber(value.toeicQuestionId) ||
    !isNumber(value.questionNumber) ||
    !isNumber(value.wrongCount) ||
    !isString(value.lastWrongAt)
  ) {
    return null;
  }

  return {
    toeicQuestionId: value.toeicQuestionId,
    questionNumber: value.questionNumber,
    wrongCount: value.wrongCount,
    lastWrongAt: value.lastWrongAt,
  };
}

export async function listWrongQuestions(
  token: string,
  testId: number,
  partNumber: number,
  init?: RequestInit,
) {
  const body = await apiRequest(
    `/tests/practice/wrong-questions?testId=${testId}&partNumber=${partNumber}`,
    {
      ...init,
      token,
    },
  );

  if (!isRecord(body) || !Array.isArray(body.items)) {
    invalidApiResponse();
  }

  return body.items
    .map(parseWrongQuestionItem)
    .filter((item): item is WrongQuestionItem => item !== null);
}

function parsePracticePartStats(value: unknown) {
  if (!isRecord(value) || !isNumber(value.partNumber)) {
    return null;
  }

  if (
    !isNumber(value.wrongQuestionCount) ||
    !isNumber(value.practiceCorrectCount) ||
    !isNumber(value.practiceWrongCount)
  ) {
    return null;
  }

  return {
    partNumber: value.partNumber,
    wrongQuestionCount: value.wrongQuestionCount,
    practiceCorrectCount: value.practiceCorrectCount,
    practiceWrongCount: value.practiceWrongCount,
  };
}

export async function getPracticeStats(
  token: string,
  testId: number,
  init?: RequestInit,
) {
  const body = await apiRequest(`/tests/practice/stats?testId=${testId}`, {
    ...init,
    token,
  });

  if (!isRecord(body) || !Array.isArray(body.parts)) {
    invalidApiResponse();
  }

  const parts = body.parts
    .map(parsePracticePartStats)
    .filter((part): part is NonNullable<ReturnType<typeof parsePracticePartStats>> => part !== null);

  if (
    !isNumber(body.testId) ||
    !isNumber(body.wrongQuestionCount) ||
    !isNumber(body.practiceCorrectCount) ||
    !isNumber(body.practiceWrongCount)
  ) {
    invalidApiResponse();
  }

  return {
    testId: body.testId,
    wrongQuestionCount: body.wrongQuestionCount,
    practiceCorrectCount: body.practiceCorrectCount,
    practiceWrongCount: body.practiceWrongCount,
    parts,
  } satisfies PracticeStats;
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

function parseAttemptPart(value: unknown) {
  if (!isRecord(value) || !isNumber(value.partNumber)) {
    return null;
  }

  if (
    !isNumber(value.correctCount) ||
    !isNumber(value.wrongCount) ||
    !(isNullableString(value.completedAt) || value.completedAt === null)
  ) {
    return null;
  }

  return {
    partNumber: value.partNumber,
    correctCount: value.correctCount,
    wrongCount: value.wrongCount,
    completedAt: value.completedAt,
  };
}

function parseAttemptDetail(value: unknown): TestAttemptDetail | null {
  if (!isRecord(value) || !isString(value.attemptId)) {
    return null;
  }

  const parts = Array.isArray(value.parts)
    ? value.parts
        .map(parseAttemptPart)
        .filter((part): part is NonNullable<ReturnType<typeof parseAttemptPart>> => part !== null)
    : [];

  if (
    !isNumber(value.testId) ||
    !isString(value.testLabel) ||
    !isNumber(value.year) ||
    !isString(value.startedAt) ||
    !(isNullableString(value.completedAt) || value.completedAt === null) ||
    !isNumber(value.totalCorrect) ||
    !isNumber(value.totalWrong) ||
    !isNumber(value.currentPartNumber)
  ) {
    return null;
  }

  return {
    attemptId: value.attemptId,
    testId: value.testId,
    testLabel: value.testLabel,
    year: value.year,
    startedAt: value.startedAt,
    completedAt: value.completedAt,
    totalCorrect: value.totalCorrect,
    totalWrong: value.totalWrong,
    currentPartNumber: value.currentPartNumber,
    parts,
  };
}

function parseAttemptSummary(value: unknown): TestAttemptSummary | null {
  if (!isRecord(value) || !isString(value.attemptId)) {
    return null;
  }

  if (
    !isNumber(value.testId) ||
    !isString(value.testLabel) ||
    !isNumber(value.year) ||
    !isString(value.startedAt) ||
    !(isNullableString(value.completedAt) || value.completedAt === null) ||
    !isNumber(value.totalCorrect) ||
    !isNumber(value.totalWrong) ||
    !isNumber(value.currentPartNumber)
  ) {
    return null;
  }

  return {
    attemptId: value.attemptId,
    testId: value.testId,
    testLabel: value.testLabel,
    year: value.year,
    startedAt: value.startedAt,
    completedAt: value.completedAt,
    totalCorrect: value.totalCorrect,
    totalWrong: value.totalWrong,
    currentPartNumber: value.currentPartNumber,
  };
}

export async function createTestAttempt(token: string, testId: number) {
  const body = await apiRequest("/tests/attempts", {
    method: "POST",
    token,
    body: JSON.stringify({ testId }),
  });

  const attempt = parseAttemptDetail(body);
  if (!attempt) {
    invalidApiResponse();
  }

  return attempt;
}

export async function listTestAttempts(
  token: string,
  params?: { testId?: number; limit?: number; offset?: number },
  init?: RequestInit,
) {
  const searchParams = new URLSearchParams();
  if (params?.testId) {
    searchParams.set("testId", String(params.testId));
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  const query = searchParams.toString();
  const body = await apiRequest(`/tests/attempts${query ? `?${query}` : ""}`, {
    ...init,
    token,
  });

  if (!isRecord(body) || !Array.isArray(body.items) || !isNumber(body.total)) {
    invalidApiResponse();
  }

  const items = body.items
    .map(parseAttemptSummary)
    .filter((item): item is TestAttemptSummary => item !== null);

  return { items, total: body.total } satisfies TestAttemptListResult;
}

export async function getTestAttempt(token: string, attemptId: string) {
  const body = await apiRequest(`/tests/attempts/${attemptId}`, { token });
  const attempt = parseAttemptDetail(body);
  if (!attempt) {
    invalidApiResponse();
  }

  return attempt;
}

export async function completeTestAttemptPart(
  token: string,
  attemptId: string,
  partNumber: number,
  payload: { correctCount: number; wrongCount: number },
) {
  const body = await apiRequest(
    `/tests/attempts/${attemptId}/parts/${partNumber}/complete`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    },
  );

  const attempt = parseAttemptDetail(body);
  if (!attempt) {
    invalidApiResponse();
  }

  return attempt;
}

export async function syncTestAttemptProgress(
  token: string,
  attemptId: string,
  payload: {
    parts: Array<{
      partNumber: number;
      correctCount: number;
      wrongCount: number;
    }>;
    finish?: boolean;
  },
) {
  const body = await apiRequest(`/tests/attempts/${attemptId}/sync`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });

  const attempt = parseAttemptDetail(body);
  if (!attempt) {
    invalidApiResponse();
  }

  return attempt;
}
